const NEXT_WORD_COUNT = 3;
const PROMPT_LANGUAGE = "en";

// The board's words sit in the session prefix, which is prefilled once per
// board and cloned per request, so each prediction only sends the sentence.
// Worked examples with their own small word lists measurably beat both a bare
// instruction and the list repeated in every request.
const SYSTEM_PROMPT =
  "A person who talks by tapping word buttons is building a sentence. Choose the 3 words from the list that best fill the blank, so the sentence is natural and something people often say. Most likely first.";

const EXAMPLES: readonly LanguageModelMessage[] = [
  {
    role: "user",
    content: 'Sentence: "I ___"\nWords: want, the, red, eat, happy, go',
  },
  { role: "assistant", content: '{"words":["want","eat","go"]}' },
  {
    role: "user",
    content: 'Sentence: "I want ___"\nWords: apple, to, sad, more, is, ball',
  },
  { role: "assistant", content: '{"words":["to","more","apple"]}' },
  {
    role: "user",
    content: 'Sentence: "I feel ___"\nWords: tired, run, happy, cup, sick, the',
  },
  { role: "assistant", content: '{"words":["happy","tired","sick"]}' },
];

export function nextWordLanguageOptions(
  language: string,
): LanguageModelCreateCoreOptions {
  return {
    expectedInputs: [
      { type: "text", languages: [...new Set([PROMPT_LANGUAGE, language])] },
    ],
    expectedOutputs: [{ type: "text", languages: [language] }],
  };
}

export function nextWordInitialPrompts(
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

export function nextWordPrompt(text: string): string {
  return `Sentence: "${text} ___"`;
}

export function nextWordConstraint(
  vocabulary: readonly string[],
  text: string,
): Record<string, unknown> {
  const candidates = candidateWords(vocabulary, text);
  const count = Math.min(NEXT_WORD_COUNT, candidates.length);

  return {
    type: "object",
    properties: {
      words: {
        type: "array",
        items: { type: "string", enum: candidates },
        minItems: count,
        maxItems: count,
      },
    },
    required: ["words"],
    additionalProperties: false,
  };
}

export function parseNextWords(
  response: string,
  vocabulary: readonly string[],
): string[] {
  const parsed: unknown = JSON.parse(response);
  const words = isWordList(parsed) ? parsed.words : [];
  const allowed = new Set(vocabulary);

  return [...new Set(words)]
    .filter((word) => allowed.has(word))
    .slice(0, NEXT_WORD_COUNT);
}

// The model otherwise often echoes the word just tapped ("I want to" → "to").
function candidateWords(vocabulary: readonly string[], text: string): string[] {
  const lastWord = text.trim().split(/\s+/).at(-1)?.toLowerCase();

  return vocabulary.filter((word) => word.toLowerCase() !== lastWord);
}

function isWordList(value: unknown): value is { words: string[] } {
  return (
    typeof value === "object" &&
    value !== null &&
    "words" in value &&
    Array.isArray(value.words) &&
    value.words.every((word) => typeof word === "string")
  );
}
