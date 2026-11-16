import type { SpeechParameters } from "@shared/speech/speech-synthesis";
import { createExternalStore } from "@shared/stores/external-store";
import { assertNever } from "@shared/utils/assert-never";
import { playAudio } from "./outputs/play-audio";
import { speak } from "./outputs/speak";
import type {
  AudioStep,
  PlaybackCoordinator,
  PlaybackOutcome,
  PlaybackRequest,
  PlaybackState,
  PlaybackStep,
} from "./playback-types";

/** Text in an unknown language is spoken as the communication language. */
export type GetSpeechParameters = (
  textLanguage: string | undefined,
) => SpeechParameters;

interface PlaybackSession {
  abortController: AbortController;
  request: PlaybackRequest;
}

export function createPlaybackCoordinator(
  getSpeechParameters: GetSpeechParameters,
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

  function interrupt() {
    const session = currentSession;
    currentSession = null;
    session?.abortController.abort();
  }

  async function playStep(session: PlaybackSession, step: PlaybackStep) {
    const { signal } = session.abortController;

    switch (step.kind) {
      case "audio":
        setActiveCue(session, step.cue ?? null);
        await playAudioOrSpeakFallback(step, signal);
        break;

      case "speech": {
        const { cueAt } = step;
        setActiveCue(session, cueAt?.(0) ?? null);
        await speak(step.text, getSpeechParameters(step.language), {
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

  // Interrupted audio resolves rather than rejects, so only audio that could
  // not play reaches the fallback.
  async function playAudioOrSpeakFallback(
    step: AudioStep,
    signal: AbortSignal,
  ) {
    try {
      await playAudio(step.src, { signal });
    } catch (error) {
      const { fallback } = step;
      if (!fallback) {
        throw error;
      }

      await speak(fallback.text, getSpeechParameters(fallback.language), {
        signal,
      });
    }
  }

  async function play(request: PlaybackRequest): Promise<PlaybackOutcome> {
    interrupt();

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
    interrupt();
    store.setState({ status: "idle" });
  }

  function dispose() {
    interrupt();
  }

  return {
    subscribe: store.subscribe,
    getSnapshot: store.getSnapshot,
    play,
    stop,
    dispose,
  };
}
