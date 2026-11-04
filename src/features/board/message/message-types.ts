export interface MessagePartInput {
  label?: string;
  vocalization?: string;
  imageSrc?: string;
  soundSrc?: string;
}

export interface MessagePart extends MessagePartInput {
  /**
   * Minted when the part is created. A button's id cannot serve: the same
   * button can be added twice, and ids can collide across boards.
   */
  id: string;
  label: string;
}
