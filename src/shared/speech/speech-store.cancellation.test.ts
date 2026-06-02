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

  test("resolves and cancels the utterance when the signal aborts", async () => {
    const controller = new AbortController();
    const promise = speak("hello", { signal: controller.signal });

    controller.abort();

    await expect(promise).resolves.toBeUndefined();
    expect(cancelSpy).toHaveBeenCalled();
  });

  test.each(["canceled", "interrupted"] as const)(
    "resolves when a superseded utterance reports '%s'",
    async (error) => {
      const promise = speak("hello");

      spokenUtterance?.onerror?.({ error } as SpeechSynthesisErrorEvent);

      await expect(promise).resolves.toBeUndefined();
    },
  );

  test("rejects when the utterance reports a genuine failure", async () => {
    const promise = speak("hello");

    spokenUtterance?.onerror?.({
      error: "synthesis-failed",
    } as SpeechSynthesisErrorEvent);

    await expect(promise).rejects.toThrow("synthesis-failed");
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
});
