import { assertNever } from "@shared/utils/assert-never";
import { createExternalStore } from "@shared/state/external-store";
import type {
  PlaybackCoordinator,
  PlaybackOutcome,
  PlaybackRequest,
  PlaybackState,
} from "./playback-types";
import { playAudio } from "./outputs/play-audio";
import { speak } from "./outputs/speak";

interface PlaybackSession {
  abortController: AbortController;
  request: PlaybackRequest;
}

export function createPlaybackCoordinator(): PlaybackCoordinator {
  const store = createExternalStore<PlaybackState>({ status: "idle" });
  let currentSession: PlaybackSession | null = null;

  function setActiveCue(session: PlaybackSession, activeCue: string | null) {
    if (currentSession !== session) {
      return;
    }

    store.setState({
      status: "playing",
      owner: session.request.owner,
      activeCue,
    });
  }

  function interruptCurrentSession() {
    const session = currentSession;
    currentSession = null;
    session?.abortController.abort();
  }

  async function play(request: PlaybackRequest): Promise<PlaybackOutcome> {
    interruptCurrentSession();

    const session: PlaybackSession = {
      abortController: new AbortController(),
      request,
    };
    currentSession = session;
    setActiveCue(session, null);

    const { signal } = session.abortController;

    try {
      for (const step of request.steps) {
        if (signal.aborted) {
          return "interrupted";
        }

        switch (step.kind) {
          case "audio":
            setActiveCue(session, step.cue ?? null);
            await playAudio(step.src, { signal });
            break;

          case "speech":
            setActiveCue(session, step.cueAt?.(0) ?? null);
            await speak(step.text, {
              signal,
              onBoundary: step.cueAt
                ? (charIndex) =>
                    setActiveCue(session, step.cueAt?.(charIndex) ?? null)
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
