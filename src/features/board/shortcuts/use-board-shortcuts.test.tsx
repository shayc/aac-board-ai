import { stubAudio } from "@shared/testing/stub-audio";
import { preventSpeechEnd, stubSpeech } from "@shared/testing/stub-speech";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import {
  renderCommunicationBoard,
  TWO_BUTTON_BOARD,
} from "../testing/render-communication-board";

describe("board keyboard shortcuts", () => {
  let speech: ReturnType<typeof stubSpeech>;

  beforeEach(() => {
    speech = stubSpeech();
    stubAudio();
  });

  test("Backspace from a focused tile removes the last tile from the message", async () => {
    const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);
    await screen.getByRole("button", { name: "hello" }).click();
    await screen.getByRole("button", { name: "world" }).click();

    screen.getByRole("button", { name: "world" }).element().focus();
    await userEvent.keyboard("{Backspace}");

    speech.speak.mockClear();
    await screen.getByRole("button", { name: "Play message" }).click();

    await vi.waitFor(() => {
      expect(speech.spokenTexts()).toEqual(["hello"]);
    });
  });

  test("Backspace from a control outside the grid removes the last tile from the message", async () => {
    const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);
    await screen.getByRole("button", { name: "hello" }).click();
    await screen.getByRole("button", { name: "world" }).click();

    screen.getByRole("button", { name: "Play message" }).element().focus();
    await userEvent.keyboard("{Backspace}");

    speech.speak.mockClear();
    await screen.getByRole("button", { name: "Play message" }).click();

    await vi.waitFor(() => {
      expect(speech.spokenTexts()).toEqual(["hello"]);
    });
  });

  test("⌘+Z restores a message that ⌘+Backspace cleared", async () => {
    const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);
    await screen.getByRole("button", { name: "hello" }).click();
    await screen.getByRole("button", { name: "world" }).click();

    screen.getByRole("button", { name: "world" }).element().focus();
    await userEvent.keyboard("{Meta>}{Backspace}{/Meta}");
    await userEvent.keyboard("{Meta>}z{/Meta}");

    speech.speak.mockClear();
    await screen.getByRole("button", { name: "Play message" }).click();

    await vi.waitFor(() => {
      expect(speech.spokenTexts()).toEqual(["hello world"]);
    });
  });

  test("⌘+Enter plays the message", async () => {
    const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);
    await screen.getByRole("button", { name: "hello" }).click();
    await screen.getByRole("button", { name: "world" }).click();

    speech.speak.mockClear();
    screen.getByRole("button", { name: "world" }).element().focus();
    await userEvent.keyboard("{Meta>}{Enter}{/Meta}");

    await vi.waitFor(() => {
      expect(speech.spokenTexts()).toEqual(["hello world"]);
    });
  });

  test("Escape stops playback in progress", async () => {
    const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);
    await screen.getByRole("button", { name: "hello" }).click();

    preventSpeechEnd(speech.speak);

    await screen.getByRole("button", { name: "Play message" }).click();
    await expect
      .element(screen.getByRole("button", { name: "Stop message" }))
      .toBeVisible();

    screen.getByRole("button", { name: "world" }).element().focus();
    await userEvent.keyboard("{Escape}");

    await expect
      .element(screen.getByRole("button", { name: "Play message" }))
      .toBeVisible();
  });
});
