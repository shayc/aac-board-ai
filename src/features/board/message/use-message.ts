import { useRef, useState } from "react";
import { useMessagePreferences } from "./message-preferences-store";
import {
  applyEdits,
  EMPTY_MESSAGE,
  hasSameContent,
  markSpoken,
  rewriteAs,
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
  replaceWithText: (input: string) => void;
  backspace: () => void;
  clear: () => void;
  undo: () => void;
}

export function useMessage(): UseMessageReturn {
  const { clearsAfterSpeaking } = useMessagePreferences();
  const [state, setRenderedState] = useState(EMPTY_MESSAGE);
  const stateRef = useRef(state);
  const undoStackRef = useRef<Message[]>([]);
  const text = state.parts.map((part) => part.label).join(" ");

  // The setting is read each time the message is edited, so turning it off
  // releases a message that was already spoken.
  function readMessage() {
    return clearsAfterSpeaking
      ? stateRef.current
      : markSpoken(stateRef.current, false);
  }

  function commit(next: Message) {
    stateRef.current = next;
    setRenderedState(next);
  }

  // Only changes to the content are steps to undo; marking the message spoken
  // goes through `commit` and is not.
  function commitChange(next: Message) {
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
      commitChange(edited);
    }

    return edited;
  }

  function apply(edits: readonly MessageEdit[]): MessageEditOutcome {
    const current = readMessage();
    const edited = commitEdits(current, edits);

    return { edited, hasChanged: edited !== current };
  }

  // Edits made against an earlier message belong to it: they apply to it even
  // once it is spoken, instead of starting a new message, and are dropped if
  // its content changed since.
  function applyIfUnchanged(since: Message, edits: readonly MessageEdit[]) {
    const current = stateRef.current;
    if (!hasSameContent(current, since)) {
      return;
    }

    commitEdits(markSpoken(current, false), edits);
  }

  // Only a playback that reaches the end of the unchanged message counts, so a
  // replay that is under way or was stopped leaves the message open for more.
  function trackPlayback(completion: Promise<boolean>) {
    const played = setSpoken(false);

    void completion.then((hasCompleted) => {
      if (hasCompleted && hasSameContent(stateRef.current, played)) {
        setSpoken(true);
      }
    });
  }

  function setSpoken(isSpoken: boolean): Message {
    const current = stateRef.current;
    const next = markSpoken(current, isSpoken);
    if (next !== current) {
      commit(next);
    }

    return next;
  }

  function replaceWithText(input: string) {
    // Choosing a suggestion is an edit, so it opens a spoken message for more
    // even when it repeats the message.
    const current = setSpoken(false);
    const rewritten = rewriteAs(current, input);
    if (rewritten !== current) {
      commitChange(rewritten);
    }
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

    // Like any edit, undoing opens a spoken message for more, so the next
    // tile adds to the message brought back instead of replacing it.
    commit(markSpoken(previous, false));
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
