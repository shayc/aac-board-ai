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
import type { Message, MessageEdit, MessagePart } from "./message-types";

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
  applyIfUnchanged: (since: Message, edits: readonly MessageEdit[]) => void;
  trackPlayback: (completion: Promise<boolean>) => void;
  replaceWithText: (input: string, language: string | undefined) => void;
  backspace: () => void;
  clear: () => void;
  undo: () => void;
}

export function useMessage(
  initialMessage: Message = EMPTY_MESSAGE,
): UseMessageReturn {
  const { shouldClearAfterPlayback } = useMessagePreferences();
  const [state, setRenderedState] = useState(initialMessage);
  const stateRef = useRef(state);
  const undoStackRef = useRef<Message[]>([]);
  const text = state.parts.map((part) => part.label).join(" ");

  // Read on each edit so turning the setting off unmarks an already-played message.
  function readMessage() {
    return shouldClearAfterPlayback
      ? stateRef.current
      : markPlayed(stateRef.current, false);
  }

  // Save on every change since mobile OSes can kill background pages without warning.
  function commit(next: Message) {
    stateRef.current = next;
    setRenderedState(next);

    const isKept = isKeptOnDevice(next, shouldClearAfterPlayback);
    saveMessageDraft(isKept ? next : EMPTY_MESSAGE);
  }

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

  function apply(edits: readonly MessageEdit[]): MessageEditOutcome {
    const current = readMessage();
    const edited = commitEdits(current, edits);

    return { edited, hasChanged: edited !== current };
  }

  function applyIfUnchanged(since: Message, edits: readonly MessageEdit[]) {
    const current = stateRef.current;
    if (!hasSameContent(current, since)) {
      return;
    }

    // Clear `hasPlayed` so post-play edits modify `since` instead of starting a new message.
    commitEdits(markPlayed(current, false), edits);
  }

  function trackPlayback(completion: Promise<boolean>) {
    // Clear `hasPlayed` while replaying so stopping mid-replay leaves the message open.
    const playing = setPlayed(false);

    void completion.then((hasCompleted) => {
      if (hasCompleted && hasSameContent(stateRef.current, playing)) {
        setPlayed(true);
      }
    });
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

    // Clear `hasPlayed` so the next tile appends to the restored message.
    commit(markPlayed(previous, false));
  }

  return {
    parts: state.parts,
    isWordOpen: state.isWordOpen,
    text,
    apply,
    applyIfUnchanged,
    trackPlayback,
    replaceWithText,
    backspace,
    clear,
    undo,
  };
}

// Don't persist a finished message that the next selection will replace.
function isKeptOnDevice(
  message: Message,
  shouldClearAfterPlayback: boolean,
): boolean {
  return !(message.hasPlayed && shouldClearAfterPlayback);
}
