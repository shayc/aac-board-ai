export interface TilePartContent {
  readonly label?: string;
  readonly vocalization?: string;
  readonly imageSrc?: string;
  readonly soundSrc?: string;
}

// Each occurrence needs its own ID, including repeated selections of the same tile.
export interface MessagePart extends TilePartContent {
  readonly id: string;
  // Backspace removes a text part one letter at a time, and a tile part whole.
  readonly kind: "text" | "tile";
  readonly label: string;
}

export interface Message {
  readonly parts: readonly MessagePart[];
  // True only while the last part is a text part that still takes letters.
  readonly isLastWordOpen: boolean;
}
