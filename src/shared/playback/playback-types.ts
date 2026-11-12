export type PlaybackOutcome = "completed" | "interrupted" | "failed";

export type PlaybackStep =
  | {
      kind: "audio";
      src: string;
      cue?: string;
    }
  | {
      kind: "speech";
      text: string;
      cueAt?: (charIndex: number) => string | null;
    };

export interface SpeechSettings {
  lang: string;
  voice: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
  volume: number;
}

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
