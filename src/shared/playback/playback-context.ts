import { createContext } from "react";
import type { PlaybackController } from "./playback-types";

export const PlaybackContext = createContext<PlaybackController | null>(null);
