import type { MediaSource } from "@shared/media/media-source";

export type PlaybackStepOutcome =
  | { status: "completed" }
  | { status: "interrupted" }
  | { status: "failed"; error: Error };

// completedSteps counts whole steps only; a failed/interrupted step may already
// have produced output. Callers must not automatically replay the request.
export type PlaybackOutcome =
  | { status: "empty"; completedSteps: 0 }
  | { status: "completed"; completedSteps: number }
  | { status: "interrupted"; completedSteps: number }
  | {
      status: "failed";
      completedSteps: number;
      failedStepIndex: number;
      error: Error;
    };

export type PlaybackStep =
  | { kind: "audio"; src: MediaSource; trackingKey?: string }
  | {
      kind: "speech";
      text: string;
      trackingKeyAt?: (charIndex: number) => string | null;
    };

export interface PlaybackRequest {
  origin: string;
  steps: readonly PlaybackStep[];
}

export type PlaybackState =
  | { status: "idle" }
  | { status: "playing"; origin: string; activeTrackingKey: string | null };

export interface PlaybackController {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => PlaybackState;
  play: (request: PlaybackRequest) => Promise<PlaybackOutcome>;
  stop: () => void;
}

export interface PlaybackCoordinator extends PlaybackController {
  dispose: () => void;
}
