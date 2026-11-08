export type PlaybackOutcome = "completed" | "interrupted";

export type PlaybackStep =
  | {
      kind: "audio";
      src: string;
      cue?: string;
    }
  | {
      kind: "speech";
      text: string;
      language: string;
      cueAt?: (charIndex: number) => string | null;
    };

export interface PlaybackRequest {
  owner: string;
  steps: readonly PlaybackStep[];
}

export type PlaybackState =
  | { status: "idle" }
  | {
      status: "playing";
      owner: string;
      activeCue: string | null;
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
