import { useState } from "react";

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const play = (url: string) => {
    const audio = new Audio(url);
    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onpause = () => setIsPaused(false);

    audio.play();
  };

  return { play, isPlaying, isPaused };
}
