export interface MessagePartInput {
  label?: string;
  vocalization?: string;
  imageSrc?: string;
  soundSrc?: string;
}

/**
 * `id` is minted when the part is created. A button's id cannot serve: the
 * same button can be added twice, and ids can collide across boards.
 */
export interface MessagePart extends MessagePartInput {
  id: string;
  label: string;
}
