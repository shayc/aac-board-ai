export interface MessagePartInput {
  readonly label?: string;
  readonly vocalization?: string;
  readonly imageSrc?: string;
  readonly soundSrc?: string;
}

// Identity is ours, minted at creation — a button's id can't serve, since it isn't
// unique across occurrences (same button added twice, or ids colliding across boards).
export interface MessagePart extends MessagePartInput {
  readonly id: string;
  readonly label: string;
}
