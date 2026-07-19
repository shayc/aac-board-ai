export interface MessagePartContent {
  label?: string;
  vocalization?: string;
  imageSrc?: string;
  soundSrc?: string;
}

// Identity is ours, minted at creation — a button's id can't serve, since it isn't
// unique across occurrences (same button added twice, or ids colliding across boards).
export interface MessagePart extends MessagePartContent {
  id: string;
}
