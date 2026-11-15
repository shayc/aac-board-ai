import { createLanguageModel } from "@shayc/react-built-in-ai";
import {
  nextWordConstraint,
  nextWordInitialPrompts,
  nextWordLanguageOptions,
  nextWordPrompt,
  parseNextWords,
} from "./next-word-prompt";

const MAX_REMEMBERED_PREDICTIONS = 200;

interface NextWordRequest {
  text: string;
  vocabulary: readonly string[];
  language: string;
  signal: AbortSignal;
}

interface BoardSession {
  key: string;
  session: Promise<LanguageModel>;
}

// One prefilled session for the board in view; each request clones it so
// predictions never see one another.
let boardSession: BoardSession | undefined;

// The model samples, and its sampling can't be fixed on the web, so the same
// sentence on the same board could offer different words each time. Reusing
// the first answer keeps the chips where the user last saw them.
const rememberedPredictions = new Map<string, string[]>();

export async function predictNextWords({
  text,
  vocabulary,
  language,
  signal,
}: NextWordRequest): Promise<string[]> {
  const sessionKey = JSON.stringify([language, vocabulary]);
  const predictionKey = JSON.stringify([sessionKey, text]);
  const remembered = rememberedPredictions.get(predictionKey);
  if (remembered) {
    return remembered;
  }

  const base = await getBoardSession(sessionKey, vocabulary, language);
  const words = await promptNextWords(base, text, vocabulary, signal);
  // An empty answer is worth retrying on the next request.
  if (words.length > 0) {
    rememberPrediction(predictionKey, words);
  }

  return words;
}

async function getBoardSession(
  key: string,
  vocabulary: readonly string[],
  language: string,
): Promise<LanguageModel> {
  if (boardSession?.key === key) {
    return boardSession.session;
  }

  const previous = boardSession;
  const session = createLanguageModel({
    ...nextWordLanguageOptions(language),
    initialPrompts: nextWordInitialPrompts(vocabulary),
  });
  boardSession = { key, session };

  session.catch(() => {
    if (boardSession?.key === key) {
      boardSession = undefined;
    }
  });
  void previous?.session.then(
    (stale) => stale.destroy(),
    () => undefined,
  );

  return session;
}

async function promptNextWords(
  base: LanguageModel,
  text: string,
  vocabulary: readonly string[],
  signal: AbortSignal,
): Promise<string[]> {
  const session = await base.clone({ signal });

  try {
    const response = await session.prompt(nextWordPrompt(text), {
      responseConstraint: nextWordConstraint(vocabulary, text),
      omitResponseConstraintInput: true,
      signal,
    });

    return parseNextWords(response, vocabulary, text);
  } finally {
    session.destroy();
  }
}

function rememberPrediction(key: string, words: string[]) {
  if (rememberedPredictions.size >= MAX_REMEMBERED_PREDICTIONS) {
    const oldestKey = rememberedPredictions.keys().next().value;
    if (oldestKey !== undefined) {
      rememberedPredictions.delete(oldestKey);
    }
  }

  rememberedPredictions.set(key, words);
}
