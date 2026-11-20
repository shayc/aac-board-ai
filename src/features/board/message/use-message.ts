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

export interface UseMessageReturn {
  parts: readonly MessagePart[];
  isWordOpen: boolean;
  text: string;
  /** Returns whether the edits changed the message. */
  apply: (edits: readonly MessageEdit[]) => boolean;
  play: (editsAfterPlay?: readonly MessageEdit[]) => Promise<void>;
  /** Plays the message without counting it as played. */
  echo: (editsAfterPlay: readonly MessageEdit[]) => Promise<void>;
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

  // Read on every edit, so turning the setting off releases a played message.
  function readMessage() {
    return shouldClearAfterPlayback
      ? messageRef.current
      : markPlayed(messageRef.current, false);
  }

  // Saved on every change: mobile systems end hidden pages without warning.
  function commit(next: Message) {
    messageRef.current = next;
    setRenderedMessage(next);

    // A played message due to be replaced is not kept for the next person to see.
    const isDueToBeReplaced = next.hasPlayed && shouldClearAfterPlayback;
    saveMessageDraft(isDueToBeReplaced ? EMPTY_MESSAGE : next);
  }

  // Marking the message played is not a step to undo, so it uses `commit`.
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

  function apply(edits: readonly MessageEdit[]): boolean {
    const current = readMessage();

    return editFrom(current, edits) !== current;
  }

  // Edits made against an earlier message apply to it even once it has played,
  // and are dropped if its content changed since.
  function applyIfUnchanged(since: Message, edits: readonly MessageEdit[]) {
    const current = messageRef.current;
    if (!hasSameContent(current, since)) {
      return undefined;
    }

    return editFrom(markPlayed(current, false), edits);
  }

  function setPlayed(hasPlayed: boolean) {
    const current = messageRef.current;
    const next = markPlayed(current, hasPlayed);
    if (next !== current) {
      commit(next);
    }
  }

  // Counts as played only at the end of the unchanged message. Edits that
  // follow (such as a tile's ":clear") wait, so it stays visible while playing.
  async function play(editsAfterPlay: readonly MessageEdit[] = []) {
    // Started first, so a playback that cannot start changes nothing.
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

  // An echo is feedback on a tile, such as the word being spelled, so the
  // message stays open for more. Edits that follow wait as they do for `play`.
  async function echo(editsAfterPlay: readonly MessageEdit[]) {
    const echoed = messageRef.current;

    const hasCompleted = await playMessage(echoed.parts);
    if (hasCompleted) {
      applyIfUnchanged(echoed, editsAfterPlay);
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

    // Like any edit, undo reopens a played message, so the next tile adds on.
    commit(markPlayed(previous, false));
  }

  return {
    parts: message.parts,
    isWordOpen: message.isWordOpen,
    text,
    apply,
    play,
    echo,
    replaceWithText,
    backspace,
    clear,
    undo,
  };
}
