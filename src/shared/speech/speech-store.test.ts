import { stubSpeech } from "@shared/testing/device-output";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import {
  __resetSpeechStoreForTests,
  cancel,
  setPitch,
  setRate,
  setVoiceURI,
  setVolume,
  speak,
  useRate,
  useVoices,
} from "./speech-store";

describe("speech-store", () => {
  let speech: ReturnType<typeof stubSpeech>;

  beforeEach(() => {
    speech = stubSpeech();
    __resetSpeechStoreForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("speak() resolves on onend with the configured rate, pitch, and volume", async () => {
    setRate(1.5);
    setPitch(1.2);
    setVolume(0.8);

    await expect(speak("hello")).resolves.toBeUndefined();

    expect(speech.speak).toHaveBeenCalledTimes(1);
    const utterance = speech.speak.mock.calls[0][0];
    expect(utterance.text).toBe("hello");
    expect(utterance.rate).toBeCloseTo(1.5);
    expect(utterance.pitch).toBeCloseTo(1.2);
    expect(utterance.volume).toBeCloseTo(0.8);
  });

  test("speak() cancels any in-flight utterance before starting", async () => {
    await speak("hi");
    expect(speech.cancel).toHaveBeenCalledTimes(1);
  });

  test("speak() rejects when the utterance fires onerror", async () => {
    speech.speak.mockImplementationOnce((utterance) => {
      queueMicrotask(() => {
        utterance.onerror?.({
          error: "synthesis-failed",
        } as unknown as SpeechSynthesisErrorEvent);
      });
    });

    await expect(speak("hi")).rejects.toThrow("synthesis-failed");
  });

  test("cancel() forwards to speechSynthesis.cancel()", () => {
    cancel();
    expect(speech.cancel).toHaveBeenCalledTimes(1);
  });

  test("setRate updates useRate consumers", async () => {
    const { result, rerender } = await renderHook(() => useRate());
    expect(result.current).toBe(1);

    setRate(1.5);
    await rerender();
    expect(result.current).toBe(1.5);
  });

  test("voicesView reference is preserved across non-voice updates", async () => {
    const { result, rerender } = await renderHook(() => useVoices());
    const before = result.current;

    setRate(1.5);
    setPitch(1.2);
    setVolume(0.7);
    setVoiceURI("any://voice");
    await rerender();

    expect(result.current).toBe(before);
  });
});
