import { stubAudio } from "@shared/testing/stub-audio";
import { stubSpeech } from "@shared/testing/stub-speech";
import type { OBFButton } from "@shayc/open-board-format";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { renderCommunicationBoard } from "../testing/render-communication-board";
import { makeOBFBoard } from "../testing";

function renderActions(buttons: OBFButton[]) {
  const choices: OBFButton[] = [{ id: "word", label: "hello" }, ...buttons];

  return renderCommunicationBoard(
    makeOBFBoard({
      buttons: choices,
      grid: {
        rows: 1,
        columns: choices.length,
        order: [choices.map((button) => button.id)],
      },
    }),
  );
}

describe("button activation through the communication session", () => {
  let speech: ReturnType<typeof stubSpeech>;
  let audio: ReturnType<typeof stubAudio>;

  beforeEach(() => {
    speech = stubSpeech();
    audio = stubAudio();
  });

  test("composition preserves vocalization and accumulates selected content", async () => {
    const screen = await renderActions([
      { id: "apple", label: "Apple", vocalization: "Eat apple" },
    ]);
    await screen.getByRole("button", { name: "hello", exact: true }).click();
    await screen.getByRole("button", { name: "Apple", exact: true }).click();
    await screen.getByRole("button", { name: "Play message" }).click();

    await vi.waitFor(() =>
      expect(speech.speak.mock.calls.at(-1)?.[0].text).toBe("hello eat apple"),
    );
  });

  test("recorded content delegates to audio playback", async () => {
    const screen = await renderCommunicationBoard(
      makeOBFBoard({
        buttons: [{ id: "sound", label: "Bell", sound_id: "audio" }],
        sounds: [{ id: "audio", url: "bell.mp3" }],
        grid: { rows: 1, columns: 1, order: [["sound"]] },
      }),
    );
    await screen.getByRole("button", { name: "Bell" }).click();

    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(speech.speak).not.toHaveBeenCalled();
    await expect
      .element(screen.getByRole("button", { name: "Play message" }))
      .toBeEnabled();
  });

  test("backspace and clear buttons use the same draft as other controls", async () => {
    const screen = await renderActions([
      { id: "erase", label: "Erase", action: ":backspace" },
      { id: "clear", label: "Clear", action: ":clear" },
    ]);
    await screen.getByRole("button", { name: "hello", exact: true }).click();
    await screen.getByRole("button", { name: "Erase", exact: true }).click();
    await screen.getByRole("button", { name: "Play message" }).click();
    await vi.waitFor(() =>
      expect(speech.speak.mock.calls.at(-1)?.[0].text).toBe("hell"),
    );
    await screen.getByRole("button", { name: "Clear", exact: true }).click();
    await expect
      .element(screen.getByRole("button", { name: "Play message" }))
      .toBeDisabled();
  });

  test("spelling before speaking includes the mutation in the spoken snapshot", async () => {
    const screen = await renderActions([
      { id: "spell", label: "Spell", actions: ["+s", ":speak"] },
    ]);
    await screen.getByRole("button", { name: "Spell", exact: true }).click();

    expect(speech.speak.mock.calls.at(-1)?.[0].text).toBe("s");
    await expect
      .element(screen.getByRole("button", { name: "Play message" }))
      .toBeEnabled();
  });

  test("keeps the draft visible until playback completes before clearing", async () => {
    const screen = await renderActions([
      { id: "finish", label: "Finish", actions: [":speak", ":clear"] },
    ]);
    await screen.getByRole("button", { name: "hello", exact: true }).click();
    let pending: SpeechSynthesisUtterance | undefined;
    speech.speak.mockImplementationOnce((utterance) => {
      pending = utterance;
    });
    await screen.getByRole("button", { name: "Finish", exact: true }).click();
    await expect
      .element(screen.getByRole("button", { name: "Stop message" }))
      .toBeVisible();
    await expect
      .element(screen.getByText("hello", { exact: true }).last())
      .toBeVisible();

    pending?.onend?.({} as SpeechSynthesisEvent);
    await expect
      .element(screen.getByRole("button", { name: "Play message" }))
      .toBeDisabled();
  });

  test("failure preserves the message and stops remaining actions", async () => {
    const screen = await renderActions([
      { id: "finish", label: "Finish", actions: [":speak", ":clear", "+lost"] },
    ]);
    await screen.getByRole("button", { name: "hello", exact: true }).click();
    speech.speak.mockImplementationOnce((utterance) =>
      queueMicrotask(() => {
        utterance.onerror?.({
          error: "synthesis-failed",
        } as SpeechSynthesisErrorEvent);
      }),
    );
    await screen.getByRole("button", { name: "Finish", exact: true }).click();
    await expect.element(screen.getByRole("alert")).toBeVisible();
    await screen.getByRole("button", { name: "Play message" }).click();

    await vi.waitFor(() =>
      expect(speech.speak.mock.calls.at(-1)?.[0].text).toBe("hello"),
    );
  });

  test("stopping output cancels a pending clear", async () => {
    const screen = await renderActions([
      { id: "finish", label: "Finish", actions: [":speak", ":clear"] },
    ]);
    await screen.getByRole("button", { name: "hello", exact: true }).click();
    speech.speak.mockImplementationOnce(() => undefined);
    await screen.getByRole("button", { name: "Finish", exact: true }).click();
    await screen.getByRole("button", { name: "Stop message" }).click();
    await expect
      .element(screen.getByRole("button", { name: "Play message" }))
      .toBeEnabled();
  });

  test("editing during speech prevents a delayed clear from overwriting the newer draft", async () => {
    const screen = await renderActions([
      { id: "finish", label: "Finish", actions: [":speak", ":clear"] },
    ]);
    await screen.getByRole("button", { name: "hello", exact: true }).click();
    let pending: SpeechSynthesisUtterance | undefined;
    speech.speak.mockImplementationOnce((utterance) => {
      pending = utterance;
    });
    await screen.getByRole("button", { name: "Finish", exact: true }).click();
    await userEvent.keyboard("{Backspace}");
    pending?.onend?.({} as SpeechSynthesisEvent);
    await screen.getByRole("button", { name: "Play message" }).click();

    await vi.waitFor(() =>
      expect(speech.speak.mock.calls.at(-1)?.[0].text).toBe("hell"),
    );
  });

  test("waits for each playback action to finish before continuing the sequence", async () => {
    const screen = await renderActions([
      {
        id: "sequence",
        label: "Sequence",
        actions: ["+a", ":speak", "+b", ":speak", ":clear"],
      },
    ]);
    await screen.getByRole("button", { name: "Sequence", exact: true }).click();

    await vi.waitFor(() =>
      expect(
        speech.speak.mock.calls.map(([utterance]) => utterance.text),
      ).toEqual(["a", "ab"]),
    );
    await expect
      .element(screen.getByRole("button", { name: "Play message" }))
      .toBeDisabled();
  });

  test("a mutation-only sequence completes without producing output", async () => {
    const screen = await renderActions([
      {
        id: "spell",
        label: "Spell",
        actions: ["+h", "+i", ":space", "+x", ":backspace"],
      },
    ]);
    await screen.getByRole("button", { name: "Spell", exact: true }).click();

    expect(speech.speak).not.toHaveBeenCalled();
    expect(audio.play).not.toHaveBeenCalled();
    await screen.getByRole("button", { name: "Play message" }).click();
    expect(speech.speak.mock.calls.at(-1)?.[0].text).toBe("hi");
  });

  test("empty actions fall back to composition", async () => {
    const screen = await renderActions([
      { id: "empty", label: "Empty actions", actions: [] },
    ]);
    await screen
      .getByRole("button", { name: "Empty actions", exact: true })
      .click();

    expect(speech.speak.mock.calls.at(-1)?.[0].text).toBe("empty actions");
    await expect
      .element(screen.getByRole("button", { name: "Play message" }))
      .toBeEnabled();
  });
});
