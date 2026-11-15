const MAX_NEXT_WORDS = 3;
const PROMPT_LANGUAGE = "en";

// The board's words sit in the session prefix, which is prefilled once per
// board and cloned per request, so each prediction only sends the sentence.
// Answering with whole sentences, not bare words, measurably improves the
// picks: the model reads each candidate in place. Asking for a fixed count
// pads the answer with words that don't fit, so the count is the model's
// call, and the examples show one, two and three answers.
const SYSTEM_PROMPT =
  "A person who talks by tapping word buttons is building a sentence. Complete it with one word from the list in the blank, in up to 3 different ways. Only give sentences that are natural and something people often say, and give fewer than 3 when fewer words fit. Most likely first.";

const EXAMPLES: readonly LanguageModelMessage[] = [
  {
    role: "user",
    content: 'Sentence: "I ___"\nWords: want, the, red, eat, happy, go',
  },
  { role: "assistant", content: '{"sentences":["I want","I eat","I go"]}' },
  {
    role: "user",
    content:
      'Sentence: "happy birthday to ___"\nWords: you, table, run, blue, the, slowly',
  },
  { role: "assistant", content: '{"sentences":["happy birthday to you"]}' },
  {
    role: "user",
    content: 'Sentence: "I feel ___"\nWords: tired, run, happy, cup, sick, the',
  },
  {
    role: "assistant",
    content: '{"sentences":["I feel happy","I feel tired","I feel sick"]}',
  },
  {
    role: "user",
    content:
      'Sentence: "open the ___"\nWords: door, sad, window, eat, quickly, he',
  },
  {
    role: "assistant",
    content: '{"sentences":["open the door","open the window"]}',
  },
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
  const sentences = candidateWords(vocabulary, text).map((word) =>
    completedSentence(text, word),
  );

  return {
    type: "object",
    properties: {
      sentences: {
        type: "array",
        items: { type: "string", enum: sentences },
        minItems: Math.min(1, sentences.length),
        maxItems: Math.min(MAX_NEXT_WORDS, sentences.length),
      },
    },
    required: ["sentences"],
    additionalProperties: false,
  };
}

export function parseNextWords(
  response: string,
  vocabulary: readonly string[],
  text: string,
): string[] {
  const parsed: unknown = JSON.parse(response);
  const sentences = isSentenceList(parsed) ? parsed.sentences : [];
  const stem = completedSentence(text, "");
  const words = sentences
    .filter((sentence) => sentence.startsWith(stem))
    .map((sentence) => sentence.slice(stem.length));
  const allowed = new Set(vocabulary);

  return [...new Set(words)]
    .filter((word) => allowed.has(word))
    .slice(0, MAX_NEXT_WORDS);
}

// The model otherwise often echoes the word just tapped ("I want to" → "to").
function candidateWords(vocabulary: readonly string[], text: string): string[] {
  const lastWord = text.trim().split(/\s+/).at(-1)?.toLowerCase();

  return vocabulary.filter((word) => word.toLowerCase() !== lastWord);
}

function completedSentence(text: string, word: string): string {
  return `${text} ${word}`;
}

function isSentenceList(value: unknown): value is { sentences: string[] } {
  return (
    typeof value === "object" &&
    value !== null &&
    "sentences" in value &&
    Array.isArray(value.sentences) &&
    value.sentences.every((sentence) => typeof sentence === "string")
  );
}
