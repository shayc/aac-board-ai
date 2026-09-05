import { checkAvailability, createTranslator } from "@shayc/react-built-in-ai";
import {
  updateBoardStrings,
  type BoardRecord,
} from "../storage/board-content-storage";
import type { Board } from "../types";
import {
  applyResolvedPhrases,
  collectBoardPhrases,
  type BoardSummary,
  type ResolvedPhrase,
} from "./board-translations";

// A route-wide ceiling for optional work; model downloads require a settings action.
export const TRANSLATION_WAIT_MS = 1_000;

export interface LocalizedBoardContent {
  board: Board;
  boards: BoardSummary[];
  language: string;
  translationSources: string[];
}

interface BoardResolution {
  record: BoardRecord;
  phrases: Map<string, ResolvedPhrase>;
  generated: Map<string, string>;
}

/** Source records are the only translation input, even when projecting hydrated media. */
export async function resolveBoardForLanguage(
  activeBoard: Board,
  records: readonly BoardRecord[],
  language: string,
  signal?: AbortSignal,
): Promise<LocalizedBoardContent> {
  signal?.throwIfAborted();
  const resolutions = records.map((record) => ({
    record,
    phrases: collectBoardPhrases(
      record.obf,
      record.boardId === activeBoard.id,
      language,
    ),
    generated: new Map<string, string>(),
  }));

  const active = resolutions.find(
    ({ record }) => record.boardId === activeBoard.id,
  );
  const prioritized = active
    ? [active, ...resolutions.filter((resolution) => resolution !== active)]
    : resolutions;
  await translateWithinDeadline(prioritized, language, signal);
  signal?.throwIfAborted();

  const translationSources = new Set<string>();
  for (const { record, generated, phrases } of resolutions) {
    for (const phrase of phrases.values()) {
      if (phrase.isMissing && phrase.sourceLanguage) {
        translationSources.add(phrase.sourceLanguage);
      }
    }

    if (generated.size > 0) {
      // Persistence cannot hold up the snapshot. The transaction checks source identity.
      void updateBoardStrings(
        record.setId,
        record.boardId,
        language,
        Object.fromEntries(generated),
        record.obf,
      ).catch(() => undefined);
    }
  }

  const summaries = resolutions.map(({ record, phrases }) => {
    const name = record.obf.name ? phrases.get(record.obf.name) : undefined;

    return {
      boardId: record.boardId,
      name: name?.text ?? (record.name.trim() || record.boardId),
      nameLanguage: name?.language,
    };
  });
  // Source ordering stays stable across locale changes and duplicate translated names.
  const localized = active
    ? applyResolvedPhrases(activeBoard, active.phrases)
    : activeBoard;
  const summary = summaries.find(({ boardId }) => boardId === activeBoard.id);

  return {
    board: {
      ...localized,
      name: summary?.name ?? localized.name,
      nameLanguage: summary?.nameLanguage,
    },
    boards: summaries,
    language,
    translationSources: [...translationSources].sort(),
  };
}

async function translateWithinDeadline(
  resolutions: BoardResolution[],
  language: string,
  requestSignal?: AbortSignal,
): Promise<void> {
  const controller = new AbortController();
  const signal = requestSignal
    ? AbortSignal.any([requestSignal, controller.signal])
    : controller.signal;
  const stopped = new Promise<void>((resolve) => {
    if (signal.aborted) {
      resolve();
    } else {
      signal.addEventListener("abort", () => resolve(), { once: true });
    }
  });
  const timer = setTimeout(() => controller.abort(), TRANSLATION_WAIT_MS);

  try {
    await Promise.race([
      translateMissingPhrases(resolutions, language, signal),
      stopped,
    ]);
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}

async function translateMissingPhrases(
  resolutions: BoardResolution[],
  targetLanguage: string,
  signal: AbortSignal,
): Promise<void> {
  const groups = new Map<
    string,
    { resolution: BoardResolution; key: string; phrase: ResolvedPhrase }[]
  >();
  for (const resolution of resolutions) {
    for (const [key, phrase] of resolution.phrases) {
      if (!phrase.isMissing || !phrase.sourceLanguage) {
        continue;
      }
      const requests = groups.get(phrase.sourceLanguage) ?? [];
      requests.push({ resolution, key, phrase });
      groups.set(phrase.sourceLanguage, requests);
    }
  }

  for (const [sourceLanguage, requests] of groups) {
    let translator: Translator | undefined;
    function dispose() {
      const instance = translator;
      translator = undefined;
      instance?.destroy();
    }
    try {
      signal.throwIfAborted();
      const options = { sourceLanguage, targetLanguage };
      if ((await checkAvailability("Translator", options)) !== "available") {
        continue;
      }
      signal.throwIfAborted();
      translator = await createTranslator({ ...options, signal });
      signal.addEventListener("abort", dispose, { once: true });
      signal.throwIfAborted();

      for (const { resolution, key, phrase } of requests) {
        signal.throwIfAborted();
        try {
          const text = await translator?.translate(phrase.sourceText, {
            signal,
          });
          signal.throwIfAborted();
          if (text === undefined) {
            continue;
          }
          resolution.phrases.set(key, {
            ...phrase,
            text,
            language: targetLanguage,
            isMissing: false,
          });
          resolution.generated.set(key, text);
        } catch {
          // One failed phrase must not discard successful wording elsewhere.
        }
      }
    } catch {
      // Unknown, unavailable, or cancelled AI leaves source/cached wording usable.
    } finally {
      signal.removeEventListener("abort", dispose);
      dispose();
    }
  }
}
