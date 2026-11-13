import { useRef, useState } from "react";
import { useMessagePreferences } from "./message-preferences-store";
import { applyBackspace, createPart } from "./message-transforms";
import type { MessagePart } from "./message-types";

export interface UseMessageReturn {
  parts: readonly MessagePart[];
  text: string;
  getParts: () => readonly MessagePart[];
  isAwaitingNewMessage: () => boolean;
  getPartsToAddTo: () => readonly MessagePart[];
  setParts: (parts: readonly MessagePart[]) => void;
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
  const [parts, setPartsState] = useState<readonly MessagePart[]>([]);
  const partsRef = useRef(parts);
  const isSpokenRef = useRef(false);
  const text = parts.map((part) => part.label).join(" ");

  function getParts() {
    return partsRef.current;
  }

  // A spoken message stays visible until the next addition replaces it, so
  // listeners who missed it can still read it.
  function isAwaitingNewMessage() {
    return clearsAfterSpeaking && isSpokenRef.current;
  }

  function getPartsToAddTo() {
    return isAwaitingNewMessage() ? [] : partsRef.current;
  }

  function setParts(next: readonly MessagePart[]) {
    partsRef.current = next;
    isSpokenRef.current = false;
    setPartsState(next);
  }

  // Only a playback that reaches the end of the current message counts, so a
  // replay that is under way or was stopped leaves the message open for more.
  function trackPlayback(
    playedParts: readonly MessagePart[],
    completion: Promise<boolean>,
  ) {
    isSpokenRef.current = false;

    void completion.then((hasCompleted) => {
      isSpokenRef.current = hasCompleted && playedParts === partsRef.current;
    });
  }

  function replaceWithText(input: string) {
    const words = input.match(/\S+/g) ?? [];
    setParts(words.map((word) => createPart({ label: word })));
  }

  function backspace() {
    setParts(applyBackspace(getParts()));
  }

  function clear() {
    setParts([]);
  }

  return {
    parts,
    text,
    getParts,
    isAwaitingNewMessage,
    getPartsToAddTo,
    setParts,
    trackPlayback,
    replaceWithText,
    backspace,
    clear,
  };
}
