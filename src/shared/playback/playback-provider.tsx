import type { SpeechParameters } from "@shared/speech/speech-synthesis";
import { type ReactNode, useEffect, useState } from "react";
import { PlaybackContext } from "./playback-context";
import { createPlaybackCoordinator } from "./playback-coordinator";

interface PlaybackProviderProps {
  children: ReactNode;
  getSpeechParameters: () => SpeechParameters;
}

export function PlaybackProvider({
  children,
  getSpeechParameters,
}: PlaybackProviderProps) {
  const [coordinator] = useState(() =>
    createPlaybackCoordinator(getSpeechParameters),
  );

  useEffect(() => () => coordinator.dispose(), [coordinator]);

  return <PlaybackContext value={coordinator}>{children}</PlaybackContext>;
}
