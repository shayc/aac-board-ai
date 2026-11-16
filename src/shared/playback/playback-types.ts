export type PlaybackOutcome = "completed" | "interrupted" | "failed";

export interface SpokenFallback {
  text: string;
  /** The language the text is in, when known. */
  language?: string;
}

export interface AudioStep {
  kind: "audio";
  src: string;
  cue?: string;
  /** Spoken in place of the audio when it cannot play. */
  fallback?: SpokenFallback;
}

export interface SpeechStep {
  kind: "speech";
  text: string;
  /** The language the text is in, when known. */
  language?: string;
  cueAt?: (charIndex: number) => string | null;
}

export type PlaybackStep = AudioStep | SpeechStep;

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
