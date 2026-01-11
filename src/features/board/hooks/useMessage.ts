import { useSpeech } from "@shared/contexts/SpeechProvider/useSpeech";
import { useAudio } from "@shared/hooks/useAudio";
import { usePersistentState } from "@shared/hooks/usePersistentState";
import { useState } from "react";

interface Segment {
  type: "text" | "sound";
  data: string;
}

export interface MessagePart {
  id: string;
  label?: string;
  vocalization?: string;
  imageSrc?: string;
  soundSrc?: string;
}

export interface UseMessageReturn {
  parts: MessagePart[];
  text: string;
  isPlaying: boolean;
  addPart: (part: MessagePart) => void;
  addSpace: () => void;
  setParts: (parts: MessagePart[]) => void;
  removeLastPart: () => void;
  updateLastPart: (part: MessagePart) => void;
  clear: () => void;
  play: () => Promise<void>;
  stop: () => void;
}

export function useMessage(): UseMessageReturn {
  const speech = useSpeech();
  const audio = useAudio();

  const [isPlaying, setIsPlaying] = useState(false);
  const [parts, setParts] = usePersistentState<MessagePart[]>("message", []);
  const text = parts.map((part) => part.label).join(" ");

  function addPart(part: MessagePart) {
    setParts((prev) => [...prev, part]);
  }

  function removeLastPart() {
    setParts((prev) => prev.slice(0, -1));
  }

  function updateLastPart(part: MessagePart) {
    setParts((prev) => {
      const lastPart = prev.at(-1);
      if (!lastPart) {
        return [part];
      }

      return [...prev.slice(0, -1), { ...lastPart, ...part }];
    });
  }

  function clear() {
    setParts([]);
  }

  function addSpace() {
    addPart({
      id: crypto.randomUUID(),
      label: "",
    });
  }
  function stop() {
    try {
      speech.cancel();
    } catch (error) {
      console.error("Error stopping message:", error);
    } finally {
      setIsPlaying(false);
    }
  }

  async function play() {
    try {
      setIsPlaying(true);
      const segments = convertPartsToSegments(parts);

      for (const seg of segments) {
        if (seg.type === "sound") {
          await audio.play(seg.data);
        }

        if (seg.type === "text") {
          await speech.speak(seg.data);
        }
      }
    } catch (error) {
      console.error("Error playing message:", error);
      setIsPlaying(false);
    } finally {
      setIsPlaying(false);
    }
  }

  return {
    parts,
    text,
    isPlaying,
    addPart,
    addSpace,
    setParts,
    removeLastPart,
    updateLastPart,
    clear,
    play,
    stop,
  };
}

function convertPartsToSegments(parts: MessagePart[]): Segment[] {
  const segments = parts
    .map((part) => {
      if (part.soundSrc) {
        return { type: "sound", data: part.soundSrc };
      }

      const text = part.vocalization ?? part.label;
      if (text) {
        return { type: "text", data: text };
      }
      return null;
    })
    .filter((segment): segment is Segment => segment !== null);

  const mergedSegments = mergeTextSegments(segments);
  return mergedSegments;
}

function mergeTextSegments(segments: Segment[]): Segment[] {
  const mergedSegments: Segment[] = [];

  for (const currentSegment of segments) {
    const previousSegment = mergedSegments.at(-1);

    if (previousSegment?.type === "text" && currentSegment.type === "text") {
      previousSegment.data =
        `${previousSegment.data.trim()} ${currentSegment.data.trim()}`.replace(
          /\s+/g,
          " ",
        );
    } else {
      mergedSegments.push({ ...currentSegment });
    }
  }

  return mergedSegments;
}
