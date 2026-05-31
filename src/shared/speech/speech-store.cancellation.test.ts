import {
  type MockInstance,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import { speak } from "./speech-store";

// A live speechSynthesis is required here, so these tests live apart from the
// no-API suite — that one needs the module first imported while the global is
// stubbed away, which any import in the same file would defeat.
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
