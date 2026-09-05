import type { PlaybackOutcome } from "@shared/playback/playback-types";
import { assertNever } from "@shared/utils/assert-never";
import { createExternalStore } from "@shared/utils/external-store";
import {
  applyBackspace,
  appendSpace,
  appendTextToLastPart,
  createPart,
} from "../message/message-transforms";
import type { MessagePart, MessagePartContent } from "../message/message-types";
import type { BoardPlayback } from "../playback/board-playback";
import type { BoardAction } from "../types";

interface MessageSnapshot {
  readonly parts: readonly MessagePart[];
  readonly displayText: string;
  readonly revision: number;
}

interface SessionOptions {
  playback: BoardPlayback;
  onPlaybackFailure: () => void;
}

export function createCommunicationSession({
  playback,
  onPlaybackFailure,
}: SessionOptions) {
  const store = createExternalStore<MessageSnapshot>({
    parts: [],
    displayText: "",
    revision: 0,
  });
  let operationGeneration = 0;

  function replaceParts(parts: readonly MessagePart[]) {
    const { revision } = store.getSnapshot();
    store.setState({
      parts,
      displayText: parts.map((part) => part.label).join(" "),
      revision: revision + 1,
    });
  }

  async function reportPlayback(
    pending: Promise<PlaybackOutcome>,
  ): Promise<PlaybackOutcome> {
    const outcome = await pending;
    if (outcome.status === "failed") {
      onPlaybackFailure();
    }

    return outcome;
  }

  function appendAndPlay(content: MessagePartContent) {
    operationGeneration += 1;
    const part = createPart(content);
    replaceParts([...store.getSnapshot().parts, part]);
    void reportPlayback(playback.playPart(part));
  }

  function backspace() {
    operationGeneration += 1;
    replaceParts(applyBackspace(store.getSnapshot().parts));
  }

  function clear() {
    operationGeneration += 1;
    replaceParts([]);
  }

  function acceptSuggestion({
    text,
    revision,
  }: {
    text: string;
    revision: number;
  }) {
    if (revision !== store.getSnapshot().revision) {
      return;
    }

    operationGeneration += 1;
    replaceParts(
      text
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => createPart({ label: word })),
    );
  }

  function playMessage() {
    operationGeneration += 1;

    return reportPlayback(playback.playMessage(store.getSnapshot().parts));
  }

  function stop() {
    operationGeneration += 1;
    playback.stop();
  }

  async function runActions(
    actions: readonly BoardAction[],
    onHome: () => void,
  ): Promise<void> {
    const sequenceGeneration = ++operationGeneration;

    for (const action of actions) {
      if (sequenceGeneration !== operationGeneration) {
        return;
      }

      const { parts, revision } = store.getSnapshot();
      switch (action.kind) {
        case "spell":
          replaceParts(appendTextToLastPart(parts, action.text));
          break;
        case "space":
          replaceParts(appendSpace(parts));
          break;
        case "backspace":
          replaceParts(applyBackspace(parts));
          break;
        case "clear":
          replaceParts([]);
          break;
        case "home":
          onHome();
          break;
        case "playMessage": {
          const outcome = await reportPlayback(playback.playMessage(parts));
          // Playback failures and intervening edits preserve the current draft
          // instead of applying the remaining actions.
          if (
            outcome.status !== "completed" ||
            revision !== store.getSnapshot().revision
          ) {
            return;
          }
          break;
        }
        default:
          assertNever(action);
      }
    }
  }

  function dispose() {
    stop();
    replaceParts([]);
  }

  return {
    subscribe: store.subscribe,
    getSnapshot: store.getSnapshot,
    appendAndPlay,
    backspace,
    clear,
    acceptSuggestion,
    playMessage,
    stop,
    runActions,
    dispose,
  };
}

export type CommunicationSession = ReturnType<
  typeof createCommunicationSession
>;
