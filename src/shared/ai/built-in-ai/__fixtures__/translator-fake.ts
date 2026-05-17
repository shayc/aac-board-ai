import { vi } from "vitest";

interface FakeOptions {
  status?: Availability;
  failCreate?: boolean;
  /** Wire a monitor EventTarget and dispatch a `downloadprogress` event during create(). */
  withMonitor?: boolean;
}

export function makeTranslatorFake({
  status = "available",
  failCreate = false,
  withMonitor = false,
}: FakeOptions = {}) {
  const destroy = vi.fn();
  const create = vi.fn((options: { monitor?: (m: EventTarget) => void }) => {
    if (failCreate) {
      return Promise.reject(new Error("create failed"));
    }
    if (withMonitor) {
      const monitor = new EventTarget();
      options.monitor?.(monitor);
      monitor.dispatchEvent(
        Object.assign(new Event("downloadprogress"), { loaded: 0.5 }),
      );
    }
    return Promise.resolve({
      translate: (input: string) => Promise.resolve(`T:${input}`),
      destroy,
    });
  });
  return {
    Fake: { availability: vi.fn(() => Promise.resolve(status)), create },
    create,
    destroy,
  };
}
