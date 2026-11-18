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

/**
 * A step highlights one cue for the whole utterance, or maps each word
 * boundary to the cue it reaches.
 */
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

export interface PlaybackCoordinator {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => PlaybackState;
  play: (request: PlaybackRequest) => Promise<PlaybackOutcome>;
  stop: () => void;
}
