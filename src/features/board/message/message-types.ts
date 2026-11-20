import type { BoardKey } from "@features/library";

export interface ButtonKey extends BoardKey {
  readonly buttonId: string;
}

export interface TilePart {
  readonly kind: "tile";
  readonly id: string;
  readonly label: string;
  readonly language: string | undefined;
  readonly vocalization?: string;
  readonly imageSrc?: string;
  readonly soundSrc?: string;
  /** The stored button the picture came from; it outlives a picture that could not be read. */
  readonly imageSource?: ButtonKey;
  /** The stored button the sound came from; it outlives a sound that could not be read. */
  readonly soundSource?: ButtonKey;
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

/** Plays the parts and resolves to whether they played to their end. */
export type PlayMessage = (parts: readonly MessagePart[]) => Promise<boolean>;

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
