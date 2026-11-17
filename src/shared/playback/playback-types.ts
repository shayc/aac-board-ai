import type { SpeechText } from "@shared/speech/speech-synthesis";

export type PlaybackOutcome = "completed" | "interrupted" | "failed";

export interface AudioStep {
  kind: "audio";
  src: string;
  cue?: string;
  /** Spoken in place of the audio when it cannot play. */
  fallback?: SpeechText;
}

interface SpeechStepBase extends SpeechText {
  kind: "speech";
}

/** Highlights either a single `cue` for the whole utterance or `cueAt` each word boundary. */
export type SpeechStep = SpeechStepBase &
  (
    | { cue?: string; cueAt?: never }
    | { cue?: never; cueAt: (charIndex: number) => string | null }
  );

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
