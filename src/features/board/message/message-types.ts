export interface MessagePartInput {
  readonly label?: string;
  // Backspace removes a spelled word one letter at a time, and any other part
  // whole.
  readonly isSpelled?: boolean;
  readonly vocalization?: string;
  readonly imageSrc?: string;
  readonly soundSrc?: string;
}

// Each occurrence needs its own ID, including repeated selections of the same tile.
export interface MessagePart extends MessagePartInput {
  readonly id: string;
  readonly label: string;
}

export interface Message {
  readonly finishedParts: readonly MessagePart[];
  // The spelled word that still takes letters. It is shown and spoken after
  // the finished parts.
  readonly openWord: MessagePart | null;
}
