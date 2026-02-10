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

  const cleanup = () => {
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
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  const play = async (url: string) => {
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

      audio.onerror = (e) => {
        setIsPlaying(false);
        rejectRef.current = null;
        reject(new Error(`Audio error: ${(e as Event).type}`));
      };

      audio.play().catch((err: unknown) => {
        setIsPlaying(false);
        rejectRef.current = null;
        reject(err instanceof Error ? err : new Error(String(err)));
      });
    });
  };

  const stop = () => {
    cleanup();
    setIsPlaying(false);
    setIsPaused(false);
  };

  return { play, stop, isPlaying, isPaused };
}
