import { useRef, useState } from "react";
import { useMessagePreferences } from "./message-preferences-store";
import {
  applyBackspace,
  createTextPart,
  EMPTY_MESSAGE,
} from "./message-transforms";
import type { Message, MessagePart } from "./message-types";

export interface UseMessageReturn {
  parts: readonly MessagePart[];
  isWordOpen: boolean;
  text: string;
  getState: () => Message;
  isAwaitingNewMessage: () => boolean;
  getStateToAddTo: () => Message;
  setState: (state: Message) => void;
  trackPlayback: (
    playedParts: readonly MessagePart[],
    completion: Promise<boolean>,
  ) => void;
  replaceWithText: (input: string) => void;
  backspace: () => void;
  clear: () => void;
}

export function useMessage(): UseMessageReturn {
  const { clearsAfterSpeaking } = useMessagePreferences();
  const [state, setRenderedState] = useState(EMPTY_MESSAGE);
  const stateRef = useRef(state);
  const isSpokenRef = useRef(false);
  const text = state.parts.map((part) => part.label).join(" ");

  function getState() {
    return stateRef.current;
  }

  // A spoken message stays visible until the next addition replaces it, so
  // listeners who missed it can still read it.
  function isAwaitingNewMessage() {
    return clearsAfterSpeaking && isSpokenRef.current;
  }

  function getStateToAddTo() {
    return isAwaitingNewMessage() ? EMPTY_MESSAGE : stateRef.current;
  }

  function setState(next: Message) {
    stateRef.current = next;
    isSpokenRef.current = false;
    setRenderedState(next);
  }

  // Only a playback that reaches the end of the current message counts, so a
  // replay that is under way or was stopped leaves the message open for more.
  function trackPlayback(
    playedParts: readonly MessagePart[],
    completion: Promise<boolean>,
  ) {
    isSpokenRef.current = false;

    void completion.then((hasCompleted) => {
      isSpokenRef.current =
        hasCompleted && playedParts === stateRef.current.parts;
    });
  }

  function replaceWithText(input: string) {
    const words = input.match(/\S+/g) ?? [];
    setState({
      parts: words.map(createTextPart),
      isWordOpen: words.length > 0,
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
    isAwaitingNewMessage,
    getStateToAddTo,
    setState,
    trackPlayback,
    replaceWithText,
    backspace,
    clear,
  };
}
