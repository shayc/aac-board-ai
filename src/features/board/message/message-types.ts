export interface TilePart {
  readonly kind: "tile";
  readonly id: string;
  readonly label: string;
  readonly language: string | undefined;
  readonly vocalization?: string;
  readonly imageSrc?: string;
  readonly soundSrc?: string;
}

export interface TextPart {
  readonly kind: "text";
  readonly id: string;
  readonly label: string;
  readonly language: string | undefined;
}

/** `id` is unique per occurrence; `language` is the part's own text language, when known. */
export type MessagePart = TilePart | TextPart;

export interface Message {
  readonly parts: readonly MessagePart[];
  /** True while the trailing text part is still open for spelling. */
  readonly isWordOpen: boolean;
  /** True after full playback; stays visible until the next tile or letter replaces it. */
  readonly hasPlayed: boolean;
}

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
