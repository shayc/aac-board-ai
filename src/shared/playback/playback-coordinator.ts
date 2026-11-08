import { assertNever } from "@shared/utils/assert-never";
import { createExternalStore } from "@shared/state/external-store";
import type {
  PlaybackCoordinator,
  PlaybackOutcome,
  PlaybackRequest,
  PlaybackState,
  PlaybackStep,
} from "./playback-types";
import { playAudio } from "./outputs/play-audio";
import { speak } from "./outputs/speak";

interface PlaybackSession {
  request: PlaybackRequest;
  signal: AbortSignal;
  abort: () => void;
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
    session?.abort();
  }

  function startSession(request: PlaybackRequest): PlaybackSession {
    interruptCurrentSession();

    const abortController = new AbortController();
    const session: PlaybackSession = {
      request,
      signal: abortController.signal,
      abort: () => abortController.abort(),
    };
    currentSession = session;
    setActiveCue(session, null);

    return session;
  }

  async function playStep(session: PlaybackSession, step: PlaybackStep) {
    const { signal } = session;

    switch (step.kind) {
      case "audio":
        setActiveCue(session, step.cue ?? null);
        await playAudio(step.src, { signal });
        break;

      case "speech": {
        const { cueAt } = step;
        setActiveCue(session, cueAt?.(0) ?? null);
        await speak(step.text, {
          signal,
          onBoundary: cueAt
            ? (charIndex) => setActiveCue(session, cueAt(charIndex))
            : undefined,
        });
        break;
      }

      default:
        assertNever(step);
    }
  }

  function endSession(session: PlaybackSession) {
    if (currentSession !== session) {
      return;
    }

    currentSession = null;
    store.setState({ status: "idle" });
  }

  async function play(request: PlaybackRequest): Promise<PlaybackOutcome> {
    const session = startSession(request);

    try {
      for (const step of request.steps) {
        if (session.signal.aborted) {
          return "interrupted";
        }

        await playStep(session, step);
      }

      return session.signal.aborted ? "interrupted" : "completed";
    } finally {
      endSession(session);
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
