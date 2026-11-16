import { createLanguageModel } from "@shayc/react-built-in-ai";
import {
  continuationConstraint,
  continuationInitialPrompts,
  continuationLanguageOptions,
  continuationPrompt,
  parseContinuations,
} from "./continuation-prompt";

const MAX_REMEMBERED_PREDICTIONS = 200;

interface ContinuationBoard {
  vocabulary: readonly string[];
  language: string;
}

interface ContinuationRequest extends ContinuationBoard {
  text: string;
  signal: AbortSignal;
}

interface BoardSession {
  key: string;
  session: Promise<LanguageModel>;
}

// One prefilled session for the words near the board in view; each request clones it so
// predictions never see one another.
let boardSession: BoardSession | undefined;

// The model samples, and its sampling can't be fixed on the web, so the same
// sentence on the same board could offer different words each time. Reusing
// the first answer keeps the suggestions where the user last saw them. An
// answer with nothing to offer is remembered too: most sentences have none.
const rememberedPredictions = new Map<string, string[][]>();

export async function predictContinuations({
  text,
  vocabulary,
  language,
  signal,
}: ContinuationRequest): Promise<string[][]> {
  const predictionKey = JSON.stringify([
    boardSessionKey({ vocabulary, language }),
    text,
  ]);
  const remembered = rememberedPredictions.get(predictionKey);
  if (remembered) {
    return remembered;
  }

  const base = await getBoardSession({ vocabulary, language });
  const continuations = await promptContinuations(
    base,
    text,
    vocabulary,
    signal,
  );
  rememberPrediction(predictionKey, continuations);

  return continuations;
}

// Prefilling the session is the slow part of a board's first prediction, so
// the board starts it on opening, before there is a sentence to follow.
export function prepareContinuations(board: ContinuationBoard): void {
  // A failed session is retried by the next prediction, which reports it.
  void getBoardSession(board).catch(() => undefined);
}

function boardSessionKey({ vocabulary, language }: ContinuationBoard): string {
  return JSON.stringify([language, vocabulary]);
}

async function getBoardSession(
  board: ContinuationBoard,
): Promise<LanguageModel> {
  const { vocabulary, language } = board;
  const key = boardSessionKey(board);
  if (boardSession?.key === key) {
    return boardSession.session;
  }

  const previous = boardSession;
  const session = createLanguageModel({
    ...continuationLanguageOptions(language),
    initialPrompts: continuationInitialPrompts(vocabulary),
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

async function promptContinuations(
  base: LanguageModel,
  text: string,
  vocabulary: readonly string[],
  signal: AbortSignal,
): Promise<string[][]> {
  const session = await base.clone({ signal });

  try {
    const response = await session.prompt(continuationPrompt(text), {
      responseConstraint: continuationConstraint(vocabulary, text),
      omitResponseConstraintInput: true,
      signal,
    });

    return parseContinuations(response, vocabulary, text);
  } finally {
    session.destroy();
  }
}

function rememberPrediction(key: string, continuations: string[][]) {
  if (rememberedPredictions.size >= MAX_REMEMBERED_PREDICTIONS) {
    const oldestKey = rememberedPredictions.keys().next().value;
    if (oldestKey !== undefined) {
      rememberedPredictions.delete(oldestKey);
    }
  }

  rememberedPredictions.set(key, continuations);
}
