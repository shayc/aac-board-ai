import { assertNever } from "@shared/utils/assert-never";
import { createExternalStore } from "@shared/state/external-store";
import type {
  PlaybackCoordinator,
  PlaybackOutcome,
  PlaybackRequest,
  PlaybackState,
  PlaybackStep,
  SpeechSettings,
} from "./playback-types";
import { playAudio } from "./outputs/play-audio";
import { speak } from "./outputs/speak";

interface PlaybackSession {
  abortController: AbortController;
  request: PlaybackRequest;
}

export function createPlaybackCoordinator(
  getSpeechSettings: () => SpeechSettings,
): PlaybackCoordinator {
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

  async function playStep(session: PlaybackSession, step: PlaybackStep) {
    const { signal } = session.abortController;

    switch (step.kind) {
      case "audio":
        setActiveCue(session, step.cue ?? null);
        await playAudio(step.src, { signal });
        break;

      case "speech": {
        const { cueAt } = step;
        setActiveCue(session, cueAt?.(0) ?? null);
        await speak(step.text, getSpeechSettings(), {
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

  async function play(request: PlaybackRequest): Promise<PlaybackOutcome> {
    interruptCurrentSession();

    const session: PlaybackSession = {
      abortController: new AbortController(),
      request,
    };
    currentSession = session;
    setActiveCue(session, null);

    const { signal } = session.abortController;
    let hasFailedStep = false;

    try {
      for (const step of request.steps) {
        if (signal.aborted) {
          return "interrupted";
        }

        try {
          await playStep(session, step);
        } catch {
          hasFailedStep = true;
        }
      }

      if (signal.aborted) {
        return "interrupted";
      }

      return hasFailedStep ? "failed" : "completed";
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
