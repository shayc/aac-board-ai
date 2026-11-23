import { assertNever } from "@shared/utils/assert-never";
import { randomId } from "@shared/utils/random-id";

export const EMPTY_MESSAGE: Message = {
  parts: [],
  isWordOpen: false,
  hasPlayed: false,
};

const graphemeSegmenter = new Intl.Segmenter(undefined, {
  granularity: "grapheme",
});

export interface TilePart {
  readonly kind: "tile";
  readonly id: string;
  readonly label: string;
  readonly language: string | undefined;
  readonly vocalization?: string;
  readonly imageSrc?: string;
  readonly soundSrc?: string;
}

export interface TextPart {
  readonly kind: "text";
  readonly id: string;
  readonly label: string;
  readonly language: string | undefined;
}

/**
 * Each occurrence has its own ID, even repeats of one tile. Its language, when
 * known, can differ from the communication language and from part to part.
 */
export type MessagePart = TilePart | TextPart;

export interface Message {
  readonly parts: readonly MessagePart[];
  /**
   * True while the last part is a text part that spelling still extends. A
   * space or a new tile closes the word, so it is never true for a tile part.
   */
  readonly isWordOpen: boolean;
  /**
   * True once the message has played to its end unchanged. It stays visible so
   * listeners who missed it can still read it, and the next tile or letter
   * starts a new message. Any edit, such as a backspace, makes it false again.
   */
  readonly hasPlayed: boolean;
}

export type MessageEdit =
  | { readonly kind: "tile"; readonly part: TilePart }
  | {
      readonly kind: "spell";
      readonly text: string;
      readonly language: string | undefined;
    }
  | { readonly kind: "space" }
  | { readonly kind: "backspace" }
  | { readonly kind: "clear" };

export function createTilePart(
  content: Omit<TilePart, "kind" | "id">,
): TilePart {
  return { ...content, kind: "tile", id: randomId() };
}

export function createTextPart(
  label: string,
  language: string | undefined,
): TextPart {
  return { kind: "text", id: randomId(), label, language };
}

export function appendTilePart(message: Message, part: TilePart): Message {
  const { parts } = messageToAddTo(message);

  return { parts: [...parts, part], isWordOpen: false, hasPlayed: false };
}

// A word keeps the language it was started in, so letters added from a board
// in another language do not change how the whole word is pronounced.
export function spell(
  message: Message,
  text: string,
  language: string | undefined,
): Message {
  if (!text) {
    return message;
  }

  const { parts, isWordOpen } = messageToAddTo(message);
  const lastPart = parts.at(-1);
  if (!isWordOpen || lastPart?.kind !== "text") {
    return {
      parts: [...parts, createTextPart(text, language)],
      isWordOpen: true,
      hasPlayed: false,
    };
  }

  return {
    parts: parts.with(-1, { ...lastPart, label: `${lastPart.label}${text}` }),
    isWordOpen: true,
    hasPlayed: false,
  };
}

// A played message has no word for a space to end: the next letter starts a
// new message either way.
export function closeWord(message: Message): Message {
  if (!message.isWordOpen || message.hasPlayed) {
    return message;
  }

  return { ...message, isWordOpen: false };
}

export function markPlayed(message: Message, hasPlayed: boolean): Message {
  if (message.hasPlayed === hasPlayed) {
    return message;
  }

  return { ...message, hasPlayed };
}

// Every edit replaces the parts or changes whether the last word is open, so
// two messages that share both differ at most in whether they have played.
export function hasSameContent(first: Message, second: Message): boolean {
  return first.parts === second.parts && first.isWordOpen === second.isWordOpen;
}

export function applyBackspace(message: Message): Message {
  const lastPart = message.parts.at(-1);
  if (!lastPart) {
    return message;
  }

  if (lastPart.kind === "tile") {
    return removeLastPart(message);
  }

  if (!message.isWordOpen) {
    return { parts: message.parts, isWordOpen: true, hasPlayed: false };
  }

  const label = removeLastGrapheme(lastPart.label);
  if (!label) {
    return removeLastPart(message);
  }

  return {
    parts: message.parts.with(-1, { ...lastPart, label }),
    isWordOpen: true,
    hasPlayed: false,
  };
}

export function applyEdits(
  message: Message,
  edits: readonly MessageEdit[],
): Message {
  return edits.reduce(applyEdit, message);
}

function messageToAddTo(message: Message): Message {
  return message.hasPlayed ? EMPTY_MESSAGE : message;
}

function removeLastPart(message: Message): Message {
  return {
    parts: message.parts.slice(0, -1),
    isWordOpen: false,
    hasPlayed: false,
  };
}

function removeLastGrapheme(text: string): string {
  const lastGrapheme = graphemeSegmenter
    .segment(text)
    .containing(text.length - 1);

  return text.slice(0, lastGrapheme?.index ?? 0);
}

function applyEdit(message: Message, edit: MessageEdit): Message {
  switch (edit.kind) {
    case "tile":
      return appendTilePart(message, edit.part);
    case "spell":
      return spell(message, edit.text, edit.language);
    case "space":
      return closeWord(message);
    case "backspace":
      return applyBackspace(message);
    case "clear":
      return message.parts.length > 0 ? EMPTY_MESSAGE : message;
    default:
      return assertNever(edit);
  }
}
