import { useRef, useState } from "react";
import {
  applyBackspace,
  closedMessage,
  createTextPart,
  EMPTY_MESSAGE,
} from "./message-transforms";
import type { Message, MessagePart } from "./message-types";

export interface UseMessageReturn {
  parts: readonly MessagePart[];
  text: string;
  getCurrent: () => Message;
  setCurrent: (message: Message) => void;
  replaceWithText: (input: string) => void;
  backspace: () => void;
  clear: () => void;
}

export function useMessage(): UseMessageReturn {
  const [message, setMessage] = useState(EMPTY_MESSAGE);
  const messageRef = useRef(message);

  const { parts } = message;
  const text = parts.map((part) => part.label).join(" ");

  function getCurrent() {
    return messageRef.current;
  }

  function setCurrent(next: Message) {
    messageRef.current = next;
    setMessage(next);
  }

  function replaceWithText(input: string) {
    const words = input.match(/\S+/g) ?? [];
    setCurrent(closedMessage(words.map(createTextPart)));
  }

  function backspace() {
    setCurrent(applyBackspace(getCurrent()));
  }

  function clear() {
    setCurrent(EMPTY_MESSAGE);
  }

  return {
    parts,
    text,
    getCurrent,
    setCurrent,
    replaceWithText,
    backspace,
    clear,
  };
}
