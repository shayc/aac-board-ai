import type { SpeechParameters } from "@shared/speech/speech-synthesis";
import { type ReactNode, useEffect, useState } from "react";
import { PlaybackContext } from "./playback-context";
import { createPlaybackCoordinator } from "./playback-coordinator";

interface PlaybackProviderProps {
  getSpeechParameters: () => SpeechParameters;
  children: ReactNode;
}

export function PlaybackProvider({
  getSpeechParameters,
  children,
}: PlaybackProviderProps) {
  const [coordinator] = useState(() =>
    createPlaybackCoordinator(getSpeechParameters),
  );

  useEffect(() => () => coordinator.dispose(), [coordinator]);

  return <PlaybackContext value={coordinator}>{children}</PlaybackContext>;
}
