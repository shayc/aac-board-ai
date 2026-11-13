export interface TilePart {
  readonly kind: "tile";
  readonly id: string;
  readonly label: string;
  readonly vocalization?: string;
  readonly imageSrc?: string;
  readonly soundSrc?: string;
}

export interface TextPart {
  readonly kind: "text";
  readonly id: string;
  readonly label: string;
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
