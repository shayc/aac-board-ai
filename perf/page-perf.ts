export interface LongFrame {
  start: number;
  blockingDuration: number;
}

export interface PagePerf {
  interactionDurations: number[];
  lastPointerDown: number;
  longFrames: LongFrame[];
  largestPaint: number;
  watch: (name: string, selector: string) => void;
  visibleAt: (name: string, timeoutMs: number) => Promise<number>;
}

declare global {
  interface Window {
    __perf: PagePerf;
  }
}

export interface PagePerfOptions {
  watches: Record<string, string>;
  eventTimingThreshold: number;
}

/**
 * Runs in the page before any app script. Kept self-contained because
 * Playwright serializes it into the page.
 */
export function installPagePerf({
  watches,
  eventTimingThreshold,
}: PagePerfOptions): void {
  const durationsByInteraction = new Map<number, number>();
  const watched = new Map<
    string,
    { selector: string; visibleAt: Promise<number> }
  >();

  const perf: PagePerf = {
    get interactionDurations() {
      return [...durationsByInteraction.values()];
    },
    lastPointerDown: Number.NaN,
    longFrames: [],
    largestPaint: Number.NaN,
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
  performance.setResourceTimingBufferSize(10_000);

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const { interactionId } = entry as PerformanceEntry & {
        interactionId: number;
      };
      if (!interactionId) {
        continue;
      }

      durationsByInteraction.set(
        interactionId,
        Math.max(
          durationsByInteraction.get(interactionId) ?? 0,
          entry.duration,
        ),
      );
    }
  }).observe({
    type: "event",
    durationThreshold: eventTimingThreshold,
    buffered: true,
  } as PerformanceObserverInit & { durationThreshold: number });

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const { blockingDuration } = entry as PerformanceEntry & {
        blockingDuration: number;
      };
      perf.longFrames.push({ start: entry.startTime, blockingDuration });
    }
  }).observe({ type: "long-animation-frame", buffered: true });

  new PerformanceObserver((list) => {
    perf.largestPaint = list.getEntries().at(-1)?.startTime ?? Number.NaN;
  }).observe({ type: "largest-contentful-paint", buffered: true });

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
  // element is laid out and exposed to assistive technology. A user-blocking
  // task posted from requestAnimationFrame runs right after that frame's
  // style, layout and paint, ahead of the normal-priority tasks (image loads,
  // React effects) already queued, whose order varies between runs.
  function firstVisibleFrame(selector: string): Promise<number> {
    return new Promise((resolve) => {
      function isVisible(): boolean {
        const element = document.querySelector(selector);

        return (
          element !== null &&
          element.checkVisibility({ visibilityProperty: true }) &&
          element.closest('[aria-hidden="true"], [inert]') === null
        );
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
