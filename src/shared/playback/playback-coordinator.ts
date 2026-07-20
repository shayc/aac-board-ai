import { playAudio } from "@shared/audio/play-audio";
import { speak } from "@shared/speech/speak";
import { assertNever } from "@shared/utils/assert-never";
import { createExternalStore } from "@shared/utils/external-store";
import {
  type PlaybackCoordinator,
  type PlaybackOutcome,
  type PlaybackRequest,
  type PlaybackState,
} from "./playback-context";

interface PlaybackSession {
  controller: AbortController;
  request: PlaybackRequest;
}

export function createPlaybackCoordinator(): PlaybackCoordinator {
  const store = createExternalStore<PlaybackState>({ status: "idle" });
  let currentSession: PlaybackSession | null = null;

  function setActiveTrackingKey(
    session: PlaybackSession,
    activeTrackingKey: string | null,
  ) {
    if (currentSession !== session) {
      return;
    }

    store.setState({
      status: "playing",
      source: session.request.source,
      activeTrackingKey,
    });
  }

  function interruptCurrentSession() {
    const session = currentSession;
    currentSession = null;
    session?.controller.abort();
  }

  async function play(request: PlaybackRequest): Promise<PlaybackOutcome> {
    interruptCurrentSession();

    const session: PlaybackSession = {
      controller: new AbortController(),
      request,
    };
    currentSession = session;
    setActiveTrackingKey(session, null);

    const { signal } = session.controller;

    try {
      for (const step of request.steps) {
        if (signal.aborted) {
          return "interrupted";
        }

        switch (step.kind) {
          case "audio":
            setActiveTrackingKey(session, step.trackingKey ?? null);
            await playAudio(step.src, { signal });
            break;

          case "speech":
            setActiveTrackingKey(session, step.trackingKeyAt?.(0) ?? null);
            await speak(step.text, {
              signal,
              onBoundary: step.trackingKeyAt
                ? (charIndex) =>
                    setActiveTrackingKey(
                      session,
                      step.trackingKeyAt?.(charIndex) ?? null,
                    )
                : undefined,
            });
            break;

          default:
            assertNever(step);
        }
      }

      return signal.aborted ? "interrupted" : "completed";
    } finally {
      if (currentSession === session) {
        currentSession = null;
        store.setState({ status: "idle" });
      }
    }
  }

  function stop() {
    interruptCurrentSession();
    store.setState({ status: "idle" });
  }

  function dispose() {
    interruptCurrentSession();
  }

  return {
    subscribe: store.subscribe,
    getSnapshot: store.getSnapshot,
    play,
    stop,
    dispose,
  };
}
