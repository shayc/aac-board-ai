import { acquireMediaUrl } from "./acquire-media-url";
import type { MediaSource } from "./media-source";

// React owns the element lifetime; each attachment owns only its own URL.
// Ref cleanup also runs during Strict Mode replay and source replacement.
export function createImageRef(source: MediaSource) {
  return (element: HTMLImageElement | null) => {
    if (!element) {
      return;
    }

    const media = acquireMediaUrl(source);
    element.src = media.url;

    return () => {
      element.removeAttribute("src");
      media.release();
    };
  };
}
