export function fillLocalStorage(remainingCharacters = 0) {
  localStorage.setItem("quota-reserve", "x".repeat(remainingCharacters));
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

  localStorage.removeItem("quota-reserve");
}
