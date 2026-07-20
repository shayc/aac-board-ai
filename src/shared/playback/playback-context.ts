import { createContext } from "react";

export type PlaybackOutcome = "completed" | "interrupted";

export type PlaybackStep =
  | {
      kind: "audio";
      src: string;
      trackingKey?: string;
    }
  | {
      kind: "speech";
      text: string;
      trackingKeyAt?: (charIndex: number) => string | null;
    };

export interface PlaybackRequest {
  source: string;
  steps: readonly PlaybackStep[];
}

export type PlaybackState =
  | { status: "idle" }
  | {
      status: "playing";
      source: string;
      activeTrackingKey: string | null;
    };

export interface PlaybackController {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => PlaybackState;
  play: (request: PlaybackRequest) => Promise<PlaybackOutcome>;
  stop: () => void;
}

export interface PlaybackCoordinator extends PlaybackController {
  dispose: () => void;
}

export const PlaybackContext = createContext<PlaybackController | null>(null);
