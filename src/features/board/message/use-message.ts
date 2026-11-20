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

  // Checks the setting at edit time, so turning it off reopens a played
  // message and the next tile adds to it.
  function readEditableMessage() {
    return shouldClearAfterPlayback
      ? messageRef.current
      : markPlayed(messageRef.current, false);
  }

  // Saved on every change: mobile systems end hidden pages without warning.
  function commit(next: Message) {
    messageRef.current = next;
    setRenderedMessage(next);

    // Saved as empty so a played message isn't restored for the next person.
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
    const current = readEditableMessage();

    return editFrom(current, edits) !== current;
  }

  // Applies edits queued against `since`, even after it played.
  // Drops them if the message changed meanwhile.
  function applyIfUnchanged(since: Message, edits: readonly MessageEdit[]) {
    const current = messageRef.current;
    if (!hasSameContent(current, since)) {
      return undefined;
    }

    return editFrom(markPlayed(current, false), edits);
  }

  // Not undoable: marking played isn't an edit.
  function setPlayed(hasPlayed: boolean) {
    const current = messageRef.current;
    const next = markPlayed(current, hasPlayed);
    if (next !== current) {
      commit(next);
    }
  }

  // Marked played only if it finished unchanged. `editsAfterPlay` (such as a
  // tile's ":clear") wait for the end, so the message stays visible meanwhile.
  async function play(editsAfterPlay: readonly MessageEdit[] = []) {
    // Start first: if playback can't start, nothing changes.
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

  // Tile feedback, such as a word being spelled; the message stays open.
  // `editsAfterPlay` wait as they do in `play`.
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
