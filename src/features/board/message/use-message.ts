import { useRef, useState } from "react";
import { useMessagePreferences } from "./message-preferences-store";
import {
  applyEdits,
  createTextPart,
  EMPTY_MESSAGE,
  hasSameContent,
  markSpoken,
} from "./message-transforms";
import type { Message, MessageEdit, MessagePart } from "./message-types";

export interface MessageEditOutcome {
  edited: Message;
  hasChanged: boolean;
}

export interface UseMessageReturn {
  parts: readonly MessagePart[];
  isWordOpen: boolean;
  text: string;
  edit: (changes: readonly MessageEdit[]) => MessageEditOutcome;
  editIfUnchanged: (since: Message, changes: readonly MessageEdit[]) => void;
  trackPlayback: (completion: Promise<boolean>) => void;
  replaceWithText: (input: string) => void;
  backspace: () => void;
  clear: () => void;
}

export function useMessage(): UseMessageReturn {
  const { clearsAfterSpeaking } = useMessagePreferences();
  const [state, setRenderedState] = useState(EMPTY_MESSAGE);
  const stateRef = useRef(state);
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

  function commitChanges(from: Message, changes: readonly MessageEdit[]) {
    const edited = applyEdits(from, changes);
    if (edited !== from) {
      commit(edited);
    }

    return edited;
  }

  function edit(changes: readonly MessageEdit[]): MessageEditOutcome {
    const current = readMessage();
    const edited = commitChanges(current, changes);

    return { edited, hasChanged: edited !== current };
  }

  // Edits made against an earlier message belong to it: they apply to it even
  // once it is spoken, instead of starting a new message, and are dropped if
  // its content changed since.
  function editIfUnchanged(since: Message, changes: readonly MessageEdit[]) {
    const current = stateRef.current;
    if (!hasSameContent(current, since)) {
      return;
    }

    commitChanges(markSpoken(current, false), changes);
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
    const words = input.match(/\S+/g) ?? [];
    commit({
      parts: words.map(createTextPart),
      isWordOpen: words.length > 0,
      isSpoken: false,
    });
  }

  function backspace() {
    edit([{ kind: "backspace" }]);
  }

  function clear() {
    edit([{ kind: "clear" }]);
  }

  return {
    parts: state.parts,
    isWordOpen: state.isWordOpen,
    text,
    edit,
    editIfUnchanged,
    trackPlayback,
    replaceWithText,
    backspace,
    clear,
  };
}
