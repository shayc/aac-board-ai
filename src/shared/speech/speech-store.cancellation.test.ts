import {
  type MockInstance,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import { speak } from "./speech-store";

// Kept separate from the no-API suite: that suite must import speech-store only
// after stubbing speechSynthesis away, which a static import in a shared file
// would defeat.
describe("speak() under cancellation", () => {
  let speakSpy: MockInstance<SpeechSynthesis["speak"]>;
  let cancelSpy: MockInstance<SpeechSynthesis["cancel"]>;
  let spokenUtterance: SpeechSynthesisUtterance | undefined;

  beforeEach(() => {
    spokenUtterance = undefined;
    speakSpy = vi
      .spyOn(speechSynthesis, "speak")
      .mockImplementation((utterance) => {
        spokenUtterance = utterance;
      });
    cancelSpy = vi.spyOn(speechSynthesis, "cancel").mockReturnValue(undefined);
  });

  test("resolves without speaking when the signal is already aborted", async () => {
    await expect(
      speak("hello", { signal: AbortSignal.abort() }),
    ).resolves.toBeUndefined();

    expect(speakSpy).not.toHaveBeenCalled();
  });

  test("resolves and cancels the in-progress utterance when the signal aborts", async () => {
    const controller = new AbortController();
    const promise = speak("hello", { signal: controller.signal });

    const cancelsBeforeAbort = cancelSpy.mock.calls.length;
    controller.abort();
    expect(cancelSpy.mock.calls.length).toBeGreaterThan(cancelsBeforeAbort);

    await expect(promise).resolves.toBeUndefined();
  });

  test("stops reporting boundaries once the signal aborts", () => {
    const controller = new AbortController();
    const onBoundary = vi.fn();
    void speak("good morning", { signal: controller.signal, onBoundary });

    spokenUtterance?.onboundary?.({ charIndex: 0 } as SpeechSynthesisEvent);
    expect(onBoundary).toHaveBeenCalledExactlyOnceWith(0);

    controller.abort();
    spokenUtterance?.onboundary?.({ charIndex: 5 } as SpeechSynthesisEvent);
    expect(onBoundary).toHaveBeenCalledExactlyOnceWith(0);
  });

  test.each(["canceled", "interrupted", "synthesis-failed"] as const)(
    "resolves when the utterance reports '%s' (speech is best-effort)",
    async (error) => {
      const promise = speak("hello");

      spokenUtterance?.onerror?.({ error } as SpeechSynthesisErrorEvent);

      await expect(promise).resolves.toBeUndefined();
    },
  );
});
