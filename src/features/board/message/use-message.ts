import { useRef, useState } from "react";
import {
  applyBackspace,
  createTextPart,
  EMPTY_MESSAGE,
} from "./message-transforms";
import type { MessagePart, MessageState } from "./message-types";

export interface UseMessageReturn {
  parts: readonly MessagePart[];
  text: string;
  getState: () => MessageState;
  setState: (state: MessageState) => void;
  replaceWithText: (input: string) => void;
  backspace: () => void;
  clear: () => void;
}

export function useMessage(): UseMessageReturn {
  const [state, setRenderedState] = useState(EMPTY_MESSAGE);
  const stateRef = useRef(state);
  const text = state.parts.map((part) => part.label).join(" ");

  function getState() {
    return stateRef.current;
  }

  function setState(next: MessageState) {
    stateRef.current = next;
    setRenderedState(next);
  }

  function replaceWithText(input: string) {
    const words = input.match(/\S+/g) ?? [];
    setState({ parts: words.map(createTextPart), isWordOpen: false });
  }

  function backspace() {
    setState(applyBackspace(getState()));
  }

  function clear() {
    setState(EMPTY_MESSAGE);
  }

  return {
    parts: state.parts,
    text,
    getState,
    setState,
    replaceWithText,
    backspace,
    clear,
  };
}
