import type { MediaSource } from "@shared/media/media-source";

export interface MessagePartContent {
  readonly label?: string;
  readonly vocalization?: string;
  readonly image?: MediaSource;
  readonly sound?: MediaSource;
}

// Identity is ours, minted at creation — a button's id can't serve, since it isn't
// unique across occurrences (same button added twice, or ids colliding across boards).
export interface MessagePart extends MessagePartContent {
  readonly id: string;
}
