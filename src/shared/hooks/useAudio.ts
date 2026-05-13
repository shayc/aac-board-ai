import { useEffect, useRef, useState } from "react";

export interface UseAudioReturn {
  play: (url: string) => Promise<void>;
  stop: () => void;
  isPlaying: boolean;
  isPaused: boolean;
}

export function useAudio(): UseAudioReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rejectRef = useRef<((reason: Error) => void) | null>(null);

  function cleanup() {
    const audio = audioRef.current;
    if (audio) {
      audio.onplay = null;
      audio.onended = null;
      audio.onpause = null;
      audio.onerror = null;

      audio.pause();
      audio.currentTime = 0;
    }

    if (rejectRef.current) {
      rejectRef.current(new Error("Playback stopped"));
      rejectRef.current = null;
    }

    audioRef.current = null;
  }

  useEffect(() => {
    return () => cleanup();
  }, []);

  async function play(url: string) {
    cleanup();

    const audio = new Audio(url);
    audioRef.current = audio;

    return new Promise<void>((resolve, reject) => {
      rejectRef.current = reject;

      audio.onplay = () => {
        setIsPlaying(true);
        setIsPaused(false);
      };

      audio.onpause = () => {
        setIsPaused(true);
        setIsPlaying(false);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
        rejectRef.current = null;
        resolve();
      };

      audio.onerror = (error) => {
        setIsPlaying(false);
        rejectRef.current = null;
        reject(new Error(`Audio error: ${(error as Event).type}`));
      };

      audio.play().catch((error: unknown) => {
        setIsPlaying(false);
        rejectRef.current = null;
        reject(error instanceof Error ? error : new Error(String(error)));
      });
    });
  }

  function stop() {
    cleanup();
    setIsPlaying(false);
    setIsPaused(false);
  }

  return { play, stop, isPlaying, isPaused };
}
