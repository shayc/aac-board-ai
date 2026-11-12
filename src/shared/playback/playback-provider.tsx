import type { SpeechSettings } from "@shared/speech/speech-synthesis";
import { type ReactNode, useEffect, useState } from "react";
import { PlaybackContext } from "./playback-context";
import { createPlaybackCoordinator } from "./playback-coordinator";

interface PlaybackProviderProps {
  children: ReactNode;
  getSpeechSettings: () => SpeechSettings;
}

export function PlaybackProvider({
  children,
  getSpeechSettings,
}: PlaybackProviderProps) {
  const [coordinator] = useState(() =>
    createPlaybackCoordinator(getSpeechSettings),
  );

  useEffect(() => () => coordinator.dispose(), [coordinator]);

  return <PlaybackContext value={coordinator}>{children}</PlaybackContext>;
}
