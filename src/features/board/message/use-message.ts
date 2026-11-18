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
  const [state, setRenderedState] = useState(initialMessage);
  const stateRef = useRef(state);
  const undoStackRef = useRef<Message[]>([]);
  const text = state.parts.map((part) => part.label).join(" ");

  // The setting is read each time the message is edited, so turning it off
  // releases a message that was already played.
  function readMessage() {
    return shouldClearAfterPlayback
      ? stateRef.current
      : markPlayed(stateRef.current, false);
  }

  // Saved on every change rather than when the page hides: a mobile system can
  // end a page in the background without warning.
  function commit(next: Message) {
    stateRef.current = next;
    setRenderedState(next);

    const isKept = isKeptOnDevice(next, shouldClearAfterPlayback);
    saveMessageDraft(isKept ? next : EMPTY_MESSAGE);
  }

  // Marking the message played is not a step to undo, so it goes through
  // `commit`.
  function commitStep(next: Message) {
    const undoStack = undoStackRef.current;
    undoStack.push(stateRef.current);
    if (undoStack.length > UNDO_LIMIT) {
      undoStack.shift();
    }

    commit(next);
  }

  function commitEdits(from: Message, edits: readonly MessageEdit[]) {
    const edited = applyEdits(from, edits);
    if (edited !== from) {
      commitStep(edited);
    }

    return edited;
  }

  function apply(edits: readonly MessageEdit[]): boolean {
    const current = readMessage();

    return commitEdits(current, edits) !== current;
  }

  // Edits that wait for a playback belong to the message it played: they apply
  // to it even once it has played, instead of starting a new message, and are
  // dropped if the playback did not reach its end or the content changed since.
  async function applyAfterPlayback(
    completion: Promise<boolean>,
    played: Message,
    edits: readonly MessageEdit[],
  ) {
    const hasCompleted = await completion;
    const current = stateRef.current;
    if (!hasCompleted || !hasSameContent(current, played)) {
      return undefined;
    }

    return commitEdits(markPlayed(current, false), edits);
  }

  // Only a playback that reaches the end of the unchanged message counts, so a
  // replay that is under way or was stopped leaves the message open for more.
  // Edits that follow (such as a tile's ":clear") wait for it, keeping the
  // message visible while it plays; one they leave as it was has played.
  async function play(editsAfterPlay: readonly MessageEdit[] = []) {
    // Playback starts first, so one that cannot start leaves the message as
    // it was.
    const completion = playMessage(stateRef.current.parts);
    const playing = setPlayed(false);

    const edited = await applyAfterPlayback(
      completion,
      playing,
      editsAfterPlay,
    );
    if (edited && hasSameContent(edited, playing)) {
      setPlayed(true);
    }
  }

  // An echo is feedback on a tile, such as the word being spelled, so the
  // message stays open for more. Edits that follow wait as they do for `play`.
  async function echo(editsAfterPlay: readonly MessageEdit[]) {
    const echoed = stateRef.current;

    await applyAfterPlayback(playMessage(echoed.parts), echoed, editsAfterPlay);
  }

  function setPlayed(hasPlayed: boolean): Message {
    const current = stateRef.current;
    const next = markPlayed(current, hasPlayed);
    if (next !== current) {
      commit(next);
    }

    return next;
  }

  function replaceWithText(input: string, language: string | undefined) {
    const words = input.match(/\S+/g) ?? [];
    commitStep({
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
    parts: state.parts,
    isWordOpen: state.isWordOpen,
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

// A message played to its end that the next symbol replaces has done its job,
// so it is not kept where the next person to open the app would see it.
function isKeptOnDevice(
  message: Message,
  shouldClearAfterPlayback: boolean,
): boolean {
  return !(message.hasPlayed && shouldClearAfterPlayback);
}
