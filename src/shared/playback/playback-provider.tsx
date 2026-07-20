import { type ReactNode, useEffect, useState } from "react";
import { PlaybackContext } from "./playback-context";
import { createPlaybackCoordinator } from "./playback-coordinator";

interface PlaybackProviderProps {
  children: ReactNode;
}

export function PlaybackProvider({ children }: PlaybackProviderProps) {
  const [coordinator] = useState(createPlaybackCoordinator);

  useEffect(() => () => coordinator.dispose(), [coordinator]);

  return <PlaybackContext value={coordinator}>{children}</PlaybackContext>;
}
