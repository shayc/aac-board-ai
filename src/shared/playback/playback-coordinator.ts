import { assertNever } from "@shared/utils/assert-never";
import { createExternalStore } from "@shared/utils/external-store";
import {
  type PlaybackCoordinator,
  type PlaybackOutcome,
  type PlaybackRequest,
  type PlaybackState,
  type PlaybackStep,
  type PlaybackStepOutcome,
} from "./playback-types";
import { playAudio } from "./transports/play-audio";
import { speak } from "./transports/speak";

interface PlaybackRun {
  controller: AbortController;
  request: PlaybackRequest;
}

export function createPlaybackCoordinator(): PlaybackCoordinator {
  const store = createExternalStore<PlaybackState>({ status: "idle" });
  let currentRun: PlaybackRun | null = null;

  function setActiveTrackingKey(
    run: PlaybackRun,
    activeTrackingKey: string | null,
  ) {
    if (currentRun !== run) {
      return;
    }

    store.setState({
      status: "playing",
      origin: run.request.origin,
      activeTrackingKey,
    });
  }

  function interruptCurrentRun() {
    const run = currentRun;
    currentRun = null;
    run?.controller.abort();
  }

  async function play(request: PlaybackRequest): Promise<PlaybackOutcome> {
    if (request.steps.length === 0) {
      return { status: "empty", completedSteps: 0 };
    }

    interruptCurrentRun();

    const run: PlaybackRun = {
      controller: new AbortController(),
      request,
    };
    currentRun = run;
    setActiveTrackingKey(run, null);

    const { signal } = run.controller;
    let completedSteps = 0;

    try {
      for (const step of request.steps) {
        if (signal.aborted) {
          return { status: "interrupted", completedSteps };
        }

        const outcome = await playStep(step, run);
        if (outcome.status === "completed") {
          completedSteps += 1;
        }

        if (signal.aborted || outcome.status === "interrupted") {
          return { status: "interrupted", completedSteps };
        }

        if (outcome.status === "failed") {
          return {
            status: "failed",
            completedSteps,
            failedStepIndex: completedSteps,
            error: outcome.error,
          };
        }
      }

      return { status: "completed", completedSteps };
    } catch (error) {
      return signal.aborted
        ? { status: "interrupted", completedSteps }
        : {
            status: "failed",
            completedSteps,
            failedStepIndex: completedSteps,
            error: error instanceof Error ? error : new Error(String(error)),
          };
    } finally {
      if (currentRun === run) {
        currentRun = null;
        store.setState({ status: "idle" });
      }
    }
  }

  function playStep(
    step: PlaybackStep,
    run: PlaybackRun,
  ): Promise<PlaybackStepOutcome> {
    const { signal } = run.controller;

    switch (step.kind) {
      case "audio":
        setActiveTrackingKey(run, step.trackingKey ?? null);
        return playAudio(step.src, { signal });
      case "speech":
        setActiveTrackingKey(run, step.trackingKeyAt?.(0) ?? null);
        return speak(step.text, {
          signal,
          onBoundary: (charIndex) =>
            setActiveTrackingKey(run, step.trackingKeyAt?.(charIndex) ?? null),
        });
      default:
        return assertNever(step);
    }
  }

  function stop() {
    interruptCurrentRun();
    store.setState({ status: "idle" });
  }

  function dispose() {
    stop();
  }

  return {
    subscribe: store.subscribe,
    getSnapshot: store.getSnapshot,
    play,
    stop,
    dispose,
  };
}
