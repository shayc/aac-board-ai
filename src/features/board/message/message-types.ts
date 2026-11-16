export interface TilePart {
  readonly kind: "tile";
  readonly id: string;
  readonly label: string;
  // The language the text is in, when known. Speech and assistive technology
  // pronounce the part in it, whatever the communication language is.
  readonly language?: string;
  readonly vocalization?: string;
  readonly imageSrc?: string;
  readonly soundSrc?: string;
}

export interface TextPart {
  readonly kind: "text";
  readonly id: string;
  readonly label: string;
  readonly language?: string;
}

// Each occurrence needs its own ID, including repeated selections of the same tile.
export type MessagePart = TilePart | TextPart;

export interface Message {
  readonly parts: readonly MessagePart[];
  // True while the last part is a text part that spelling still extends. A
  // space or a new tile closes the word, so it is never true for a tile part.
  readonly isWordOpen: boolean;
  // True once the message has played to its end unchanged. It stays visible so
  // listeners who missed it can still read it, and the next tile or letter
  // starts a new message. Any edit, such as a backspace, makes it false again.
  readonly isSpoken: boolean;
}

export type MessageEdit =
  | { readonly kind: "tile"; readonly part: TilePart }
  | {
      readonly kind: "spell";
      readonly text: string;
      readonly language?: string;
    }
  | { readonly kind: "space" }
  | { readonly kind: "backspace" }
  | { readonly kind: "clear" };
