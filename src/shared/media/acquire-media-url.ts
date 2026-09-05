import type { MediaSource } from "./media-source";

export function acquireMediaUrl(source: MediaSource): {
  url: string;
  release: () => void;
} {
  if (typeof source === "string") {
    return { url: source, release: () => undefined };
  }

  const url = URL.createObjectURL(source);

  return { url, release: () => URL.revokeObjectURL(url) };
}
