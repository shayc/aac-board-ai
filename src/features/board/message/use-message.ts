import { useRef, useState } from "react";
import {
  applyEdits,
  createTextPart,
  EMPTY_MESSAGE,
  hasSameContent,
  markPlayed,
  type Message,
  type MessageEdit,
  type MessagePart,
} from "./message";
import { saveMessageDraft } from "./message-draft";
import { useMessagePreferences } from "./message-preferences-store";

const UNDO_LIMIT = 100;

/** Plays the parts and resolves to whether they played to their end. */
export type PlayParts = (parts: readonly MessagePart[]) => Promise<boolean>;

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
  playParts: PlayParts,
  initialMessage: Message = EMPTY_MESSAGE,
): UseMessageReturn {
  const { shouldClearAfterPlayback } = useMessagePreferences();
  const [message, setRenderedMessage] = useState(initialMessage);
  const messageRef = useRef(message);
  const undoStackRef = useRef<Message[]>([]);
  const text = message.parts.map((part) => part.label).join(" ");

  function messageToEdit() {
    return shouldClearAfterPlayback
      ? messageRef.current
      : markPlayed(messageRef.current, false);
  }

  // Saved on every change: mobile systems end hidden pages without warning.
  function commit(next: Message) {
    messageRef.current = next;
    setRenderedMessage(next);

    // Clear the saved draft so the next person never sees the played message.
    const isDueToBeReplaced = next.hasPlayed && shouldClearAfterPlayback;
    saveMessageDraft(isDueToBeReplaced ? EMPTY_MESSAGE : next);
  }

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
    const current = messageToEdit();

    return editFrom(current, edits) !== current;
  }

  // A change to hasPlayed alone must not discard pending edits.
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

  // Applying :clear early would hide the message while it is still playing.
  async function play(editsAfterPlay: readonly MessageEdit[] = []) {
    // Start first so a synchronous setup failure preserves the played flag.
    const completion = playParts(messageRef.current.parts);
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

  // An echo leaves the word open so the next letter can extend it.
  async function echo(editsAfterPlay: readonly MessageEdit[]) {
    const echoed = messageRef.current;

    const hasCompleted = await playParts(echoed.parts);
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
