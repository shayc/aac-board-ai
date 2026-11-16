const MAX_CONTINUATIONS = 3;
const MIN_ADDED_WORDS = 2;
const MAX_ADDED_WORDS = 3;
const PROMPT_LANGUAGE = "en";

// The nearby words sit in the session prefix, which is prefilled once per
// board and cloned per request, so each prediction only sends the sentence.
// Answering with whole sentences, not bare words, measurably improves the
// picks: the model reads each candidate in place. The model never answers
// that nothing fits, so it is given a one-word way out, and those answers are
// dropped: a single word is quicker to tap than to read.
const SYSTEM_PROMPT =
  "A person who talks by tapping word buttons is building a sentence. Continue it with 2 or 3 words from the list, in up to 3 different ways. Only give continuations that are natural and something people often say, and give fewer than 3 when fewer fit. When no 2 or 3 words fit naturally, continue it with the 1 word that fits best. Most likely first.";

const EXAMPLES: readonly LanguageModelMessage[] = [
  {
    role: "user",
    content:
      'Sentence: "I want ___"\nWords: to, eat, table, go, red, the, home',
  },
  {
    role: "assistant",
    content: '{"sentences":["I want to eat","I want to go home"]}',
  },
  {
    role: "user",
    content: 'Sentence: "blue ___"\nWords: table, cup, slowly, red, the, he',
  },
  { role: "assistant", content: '{"sentences":["blue cup"]}' },
  {
    role: "user",
    content: 'Sentence: "open ___"\nWords: the, sad, door, eat, window, he',
  },
  {
    role: "assistant",
    content: '{"sentences":["open the door","open the window"]}',
  },
  {
    role: "user",
    content:
      'Sentence: "I am ___"\nWords: very, cup, tired, happy, run, table, good',
  },
  {
    role: "assistant",
    content: '{"sentences":["I am very tired","I am very happy","I am good"]}',
  },
];

export function continuationLanguageOptions(
  language: string,
): LanguageModelCreateCoreOptions {
  return {
    expectedInputs: [
      { type: "text", languages: [...new Set([PROMPT_LANGUAGE, language])] },
    ],
    expectedOutputs: [{ type: "text", languages: [language] }],
  };
}

export function continuationInitialPrompts(
  vocabulary: readonly string[],
): [LanguageModelSystemMessage, ...LanguageModelMessage[]] {
  return [
    {
      role: "system",
      content: `${SYSTEM_PROMPT}\nWords on the board: ${vocabulary.join(", ")}`,
    },
    ...EXAMPLES,
  ];
}

export function continuationPrompt(text: string): string {
  return `Sentence: "${text} ___"`;
}

export function continuationConstraint(
  vocabulary: readonly string[],
  text: string,
): Record<string, unknown> {
  const word = `(?:${vocabulary.map(escapeRegExp).join("|")})`;

  return {
    type: "object",
    properties: {
      sentences: {
        type: "array",
        items: {
          type: "string",
          pattern: `^${escapeRegExp(text)} ${word}(?: ${word}){0,${MAX_ADDED_WORDS - 1}}$`,
        },
        minItems: 1,
        maxItems: MAX_CONTINUATIONS,
      },
    },
    required: ["sentences"],
    additionalProperties: false,
  };
}

/** Each continuation is the board words to add, in order. */
export function parseContinuations(
  response: string,
  vocabulary: readonly string[],
  text: string,
): string[][] {
  const parsed: unknown = JSON.parse(response);
  const sentences = isSentenceList(parsed) ? parsed.sentences : [];
  const stem = `${text} `;
  const continuations = new Map<string, string[]>();

  for (const sentence of sentences) {
    const words = sentence.startsWith(stem)
      ? splitIntoWords(sentence.slice(stem.length), vocabulary)
      : undefined;
    if (words && words.length >= MIN_ADDED_WORDS) {
      continuations.set(words.join(" "), words);
    }
  }

  return [...continuations.values()].slice(0, MAX_CONTINUATIONS);
}

function escapeRegExp(text: string): string {
  return text.replaceAll(/[.*+?^${}()|[\]\\/]/g, String.raw`\$&`);
}

function isSentenceList(value: unknown): value is { sentences: string[] } {
  if (typeof value !== "object" || value === null || !("sentences" in value)) {
    return false;
  }

  const { sentences } = value;

  return (
    Array.isArray(sentences) &&
    sentences.every((sentence) => typeof sentence === "string")
  );
}

// A label can hold a space ("thank you"), so the added text is matched against
// whole labels instead of being split on spaces.
function splitIntoWords(
  added: string,
  vocabulary: readonly string[],
  wordsLeft = MAX_ADDED_WORDS,
): string[] | undefined {
  if (added === "") {
    return [];
  }

  if (wordsLeft === 0) {
    return undefined;
  }

  for (const word of vocabulary) {
    const rest = restAfterWord(added, word);
    const restWords =
      rest === undefined
        ? undefined
        : splitIntoWords(rest, vocabulary, wordsLeft - 1);
    if (restWords) {
      return [word, ...restWords];
    }
  }

  return undefined;
}

function restAfterWord(added: string, word: string): string | undefined {
  if (added === word) {
    return "";
  }

  return added.startsWith(`${word} `)
    ? added.slice(word.length + 1)
    : undefined;
}
