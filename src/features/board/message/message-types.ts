// Each occurrence needs its own ID, including repeated selections of the same tile.
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

export type MessagePart = TilePart | TextPart;

export interface MessageState {
  readonly parts: readonly MessagePart[];
  // True while the last part is a text part that spelling still extends. A
  // space or a new tile ends the word, so it is never true for a tile part.
  readonly isWordOpen: boolean;
}
