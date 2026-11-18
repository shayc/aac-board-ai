import { useRef, useState } from "react";
import { saveMessageDraft } from "./message-draft";
import { useMessagePreferences } from "./message-preferences-store";
import {
  applyEdits,
  createTextPart,
  EMPTY_MESSAGE,
  hasSameContent,
  markPlayed,
} from "./message-transforms";
import type {
  Message,
  MessageEdit,
  MessagePart,
  PlayMessage,
} from "./message-types";

const UNDO_LIMIT = 100;

export interface MessageEditOutcome {
  edited: Message;
  hasChanged: boolean;
}

export interface UseMessageReturn {
  parts: readonly MessagePart[];
  isWordOpen: boolean;
  text: string;
  apply: (edits: readonly MessageEdit[]) => MessageEditOutcome;
  /** Returns the edited message, or undefined when the edits were dropped. */
  applyIfUnchanged: (
    since: Message,
    edits: readonly MessageEdit[],
  ) => Message | undefined;
  play: (editsAfterPlay?: readonly MessageEdit[]) => Promise<void>;
  replaceWithText: (input: string, language: string | undefined) => void;
  backspace: () => void;
  clear: () => void;
  undo: () => void;
}

export function useMessage(
  playMessage: PlayMessage,
  initialMessage: Message = EMPTY_MESSAGE,
): UseMessageReturn {
  const { shouldClearAfterPlayback } = useMessagePreferences();
  const [message, setRenderedMessage] = useState(initialMessage);
  const messageRef = useRef(message);
  const undoStackRef = useRef<Message[]>([]);
  const text = message.parts.map((part) => part.label).join(" ");

  // The setting is read each time the message is edited, so turning it off
  // releases a message that was already played.
  function readMessage() {
    return shouldClearAfterPlayback
      ? messageRef.current
      : markPlayed(messageRef.current, false);
  }

  // Saved on every change rather than when the page hides: a mobile system can
  // end a page in the background without warning.
  function commit(next: Message) {
    messageRef.current = next;
    setRenderedMessage(next);

    const isKept = isKeptOnDevice(next, shouldClearAfterPlayback);
    saveMessageDraft(isKept ? next : EMPTY_MESSAGE);
  }

  // Marking the message played is not a step to undo, so it goes through
  // `commit`.
  function commitUndoable(next: Message) {
    const undoStack = undoStackRef.current;
    undoStack.push(messageRef.current);
    if (undoStack.length > UNDO_LIMIT) {
      undoStack.shift();
    }

    commit(next);
  }

  function editFrom(base: Message, edits: readonly MessageEdit[]) {
    const edited = applyEdits(base, edits);
    if (edited !== base) {
      commitUndoable(edited);
    }

    return edited;
  }

  function apply(edits: readonly MessageEdit[]): MessageEditOutcome {
    const current = readMessage();
    const edited = editFrom(current, edits);

    return { edited, hasChanged: edited !== current };
  }

  // Edits made against an earlier message belong to it: they apply to it even
  // once it has played, instead of starting a new message, and are dropped if
  // its content changed since.
  function applyIfUnchanged(since: Message, edits: readonly MessageEdit[]) {
    const current = messageRef.current;
    if (!hasSameContent(current, since)) {
      return undefined;
    }

    return editFrom(markPlayed(current, false), edits);
  }

  // Only a playback that reaches the end of the unchanged message counts, so a
  // replay that is under way or was stopped leaves the message open for more.
  // Edits that follow (such as a tile's ":clear") wait for it, keeping the
  // message visible while it plays; one they leave as it was has played.
  async function play(editsAfterPlay: readonly MessageEdit[] = []) {
    // Playback starts first, so one that cannot start leaves the message as
    // it was.
    const completion = playMessage(messageRef.current.parts);
    setPlayed(false);
    const playingMessage = messageRef.current;

    const hasCompleted = await completion;
    if (!hasCompleted) {
      return;
    }

    const edited = applyIfUnchanged(playingMessage, editsAfterPlay);
    if (edited && hasSameContent(edited, playingMessage)) {
      setPlayed(true);
    }
  }

  function setPlayed(hasPlayed: boolean) {
    const current = messageRef.current;
    const next = markPlayed(current, hasPlayed);
    if (next !== current) {
      commit(next);
    }
  }

  function replaceWithText(input: string, language: string | undefined) {
    const words = input.match(/\S+/g) ?? [];
    commitUndoable({
      parts: words.map((word) => createTextPart(word, language)),
      isWordOpen: words.length > 0,
      hasPlayed: false,
    });
  }

  function backspace() {
    apply([{ kind: "backspace" }]);
  }

  function clear() {
    apply([{ kind: "clear" }]);
  }

  function undo() {
    const previous = undoStackRef.current.pop();
    if (!previous) {
      return;
    }

    // Like any edit, undoing opens a played message for more, so the next
    // tile adds to the message brought back instead of replacing it.
    commit(markPlayed(previous, false));
  }

  return {
    parts: message.parts,
    isWordOpen: message.isWordOpen,
    text,
    apply,
    applyIfUnchanged,
    play,
    replaceWithText,
    backspace,
    clear,
    undo,
  };
}

// A message played to its end that the next symbol replaces has done its job,
// so it is not kept where the next person to open the app would see it.
function isKeptOnDevice(
  message: Message,
  shouldClearAfterPlayback: boolean,
): boolean {
  return !(message.hasPlayed && shouldClearAfterPlayback);
}
