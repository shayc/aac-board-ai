export interface PagePerf {
  lastPointerDown: number;
  watch: (name: string, selector: string) => void;
  visibleAt: (name: string, timeoutMs: number) => Promise<number>;
}

declare global {
  interface Window {
    __perf: PagePerf;
  }
}

/**
 * Runs in the page before any app script. Kept self-contained because
 * Playwright serializes it into the page.
 */
export function installPagePerf(watches: Record<string, string>): void {
  const watched = new Map<
    string,
    { selector: string; visibleAt: Promise<number> }
  >();

  const perf: PagePerf = {
    lastPointerDown: Number.NaN,
    watch(name, selector) {
      watched.set(name, { selector, visibleAt: firstVisibleFrame(selector) });
    },
    visibleAt(name, timeoutMs) {
      const watch = watched.get(name);
      if (!watch) {
        return Promise.reject(new Error(`Nothing is watched as "${name}".`));
      }

      let timer = 0;
      const timeout = new Promise<never>((_, reject) => {
        timer = window.setTimeout(() => {
          reject(
            new Error(
              `${watch.selector} did not become visible within ${timeoutMs} ms.`,
            ),
          );
        }, timeoutMs);
      });

      return Promise.race([watch.visibleAt, timeout]).finally(() => {
        clearTimeout(timer);
      });
    },
  };
  window.__perf = perf;

  addEventListener(
    "pointerdown",
    (event) => {
      perf.lastPointerDown = event.timeStamp;
    },
    { capture: true },
  );

  // Mirrors src/shared/testing/stub-speech.ts, which depends on Vitest.
  speechSynthesis.speak = (utterance) => {
    queueMicrotask(() => {
      utterance.dispatchEvent(new SpeechSynthesisEvent("end", { utterance }));
    });
  };
  speechSynthesis.cancel = () => undefined;

  for (const [name, selector] of Object.entries(watches)) {
    perf.watch(name, selector);
  }

  // Resolves once the main thread has rendered the first frame in which the
  // element is laid out. A user-blocking task posted from requestAnimationFrame
  // runs right after that frame's style, layout and paint, ahead of the
  // normal-priority tasks (image loads, React effects) already queued, whose
  // order varies between runs.
  function firstVisibleFrame(selector: string): Promise<number> {
    return new Promise((resolve) => {
      function isVisible(): boolean {
        const element = document.querySelector(selector);

        return element?.checkVisibility({ visibilityProperty: true }) ?? false;
      }

      let isFrameScheduled = true;
      const observer = new MutationObserver(scheduleCheck);

      function scheduleCheck(): void {
        if (isFrameScheduled) {
          return;
        }
        isFrameScheduled = true;
        requestAnimationFrame(check);
      }

      function check(): void {
        isFrameScheduled = false;
        if (!isVisible()) {
          return;
        }
        observer.disconnect();

        void scheduler.postTask(
          () => {
            resolve(performance.now());
          },
          { priority: "user-blocking" },
        );
      }

      observer.observe(document, {
        subtree: true,
        childList: true,
        attributes: true,
      });
      requestAnimationFrame(check);
    });
  }
}
