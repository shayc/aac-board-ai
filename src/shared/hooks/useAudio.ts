import { useState } from "react";

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);

  function play(url: string) {
    const audio = new Audio(url);
    setIsPlaying(true);

    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);

    audio.play().catch((err) => {
      console.error("Failed to play audio:", err);
      setIsPlaying(false);
    });
  }

  return { play, isPlaying };
}
