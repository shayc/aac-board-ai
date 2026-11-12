export interface MessagePartInput {
  readonly label?: string;
  readonly vocalization?: string;
  readonly imageSrc?: string;
  readonly soundSrc?: string;
}

// Each occurrence needs its own ID, including repeated selections of the same tile.
export interface MessagePart extends MessagePartInput {
  readonly id: string;
  readonly label: string;
}
