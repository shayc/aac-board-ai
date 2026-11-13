import { useRef, useState } from "react";
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
  setState: (state: Message) => void;
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

  function setState(next: Message) {
    stateRef.current = next;
    setRenderedState(next);
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
    setState,
    replaceWithText,
    backspace,
    clear,
  };
}
