import { useState } from "react";

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const play = (url: string) => {
    return new Promise<void>((resolve, reject) => {
      try {
        const audio = new Audio(url);
        audio.onplay = () => setIsPlaying(true);
        audio.onended = () => {
          setIsPlaying(false);
          resolve();
        };
        audio.onpause = () => setIsPaused(true);

        audio.play();
      } catch (error) {
        reject(error);
      }
    });
  };

  return { play, isPlaying, isPaused };
}
