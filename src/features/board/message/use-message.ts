import { useRef, useState } from "react";
import { useMessagePreferences } from "./message-preferences-store";
import {
  applyBackspace,
  createTextPart,
  EMPTY_MESSAGE,
  markSpoken,
} from "./message-transforms";
import type { Message, MessagePart } from "./message-types";

export interface UseMessageReturn {
  parts: readonly MessagePart[];
  isWordOpen: boolean;
  text: string;
  getState: () => Message;
  setState: (state: Message) => void;
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

  // The setting is read each time the message is used, so turning it off
  // releases a message that was already spoken.
  function getState() {
    return clearsAfterSpeaking
      ? stateRef.current
      : markSpoken(stateRef.current, false);
  }

  function setState(next: Message) {
    stateRef.current = next;
    setRenderedState(next);
  }

  // Only a playback that reaches the end of the unchanged message counts, so a
  // replay that is under way or was stopped leaves the message open for more.
  function trackPlayback(completion: Promise<boolean>) {
    const played = setSpoken(false);

    void completion.then((hasCompleted) => {
      if (hasCompleted && stateRef.current === played) {
        setSpoken(true);
      }
    });
  }

  function setSpoken(isSpoken: boolean): Message {
    const current = stateRef.current;
    const next = markSpoken(current, isSpoken);
    if (next !== current) {
      setState(next);
    }

    return next;
  }

  function replaceWithText(input: string) {
    const words = input.match(/\S+/g) ?? [];
    setState({
      parts: words.map(createTextPart),
      isWordOpen: words.length > 0,
      isSpoken: false,
    });
  }

  function backspace() {
    setState(applyBackspace(getState()));
  }

  function clear() {
    setState(EMPTY_MESSAGE);
  }

  return {
    parts: state.parts,
    isWordOpen: state.isWordOpen,
    text,
    getState,
    setState,
    trackPlayback,
    replaceWithText,
    backspace,
    clear,
  };
}
