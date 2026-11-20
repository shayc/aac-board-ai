/** Fills localStorage to its quota, leaving room for about `freeCharacters`. */
export function fillLocalStorage(freeCharacters = 0): void {
  const RESERVE_KEY = "filler-reserve";
  localStorage.setItem(RESERVE_KEY, "x".repeat(freeCharacters));

  let chunk = "x".repeat(1024 * 1024);
  let index = 0;

  while (chunk.length > 0) {
    try {
      localStorage.setItem(`filler-${index}`, chunk);
      index += 1;
    } catch {
      chunk = chunk.slice(0, Math.floor(chunk.length / 2));
    }
  }

  localStorage.removeItem(RESERVE_KEY);
}
