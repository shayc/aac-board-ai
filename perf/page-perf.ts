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

// Keep self-contained because Playwright serializes this function into the page.
export function installPagePerf(watches: Record<string, string>): void {
  const watched = new Map<
    string,
    { selector: string; firstFrame: Promise<number> }
  >();

  const perf: PagePerf = {
    lastPointerDown: Number.NaN,
    watch(name, selector) {
      watched.set(name, { selector, firstFrame: firstVisibleFrame(selector) });
    },
    visibleAt(name, timeoutMs) {
      const target = watched.get(name);
      if (!target) {
        return Promise.reject(new Error(`Nothing is watched as "${name}".`));
      }

      let timer = 0;
      const timeout = new Promise<never>((_, reject) => {
        timer = window.setTimeout(() => {
          reject(
            new Error(
              `${target.selector} did not become visible within ${timeoutMs} ms.`,
            ),
          );
        }, timeoutMs);
      });

      return Promise.race([target.firstFrame, timeout]).finally(() => {
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

  // Timestamp after paint, ahead of queued normal-priority work that adds timing noise.
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
