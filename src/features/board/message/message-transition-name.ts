// A suggestion chip and the message it becomes share this name so the browser
// morphs the chip into the message bar. Message text can't be a CSS
// identifier, so the name carries a hash of it, with whitespace collapsed the
// way the message splits a phrase into words.
export function messageTransitionName(text: string): string {
  const words = text.match(/\S+/g) ?? [];
  let hash = 5381;
  for (const character of words.join(" ")) {
    hash = Math.imul(hash, 33) ^ (character.codePointAt(0) ?? 0);
  }

  return `message-${(hash >>> 0).toString(36)}`;
}
