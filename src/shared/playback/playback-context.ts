import { createContext } from "react";
import type { PlaybackCoordinator } from "./playback-types";

export const PlaybackContext = createContext<PlaybackCoordinator | null>(null);
