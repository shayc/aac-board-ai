import {
  preventSpeechEnd,
  stubAudio,
  stubSpeech,
} from "@shared/testing/device-output";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { renderBoardViewer, TWO_TILE_BOARD } from "../test-utils";

describe("board keyboard shortcuts", () => {
  let speech: ReturnType<typeof stubSpeech>;

  beforeEach(() => {
    speech = stubSpeech();
    stubAudio();
  });

  test("Backspace from a focused tile removes the last message part", async () => {
    const screen = await renderBoardViewer(TWO_TILE_BOARD);
    await screen.getByRole("button", { name: "hello" }).click();
    await screen.getByRole("button", { name: "world" }).click();

    // The key must bubble past the grid's handler (which stops propagation by
    // default) to the board root.
    screen.getByRole("button", { name: "world" }).element().focus();
    await userEvent.keyboard("{Backspace}");

    speech.speak.mockClear();
    await screen.getByRole("button", { name: "Play message" }).click();

    await vi.waitFor(() => {
      expect(speech.speak.mock.calls).toHaveLength(1);
      expect(speech.speak.mock.calls[0][0].text).toBe("hello");
    });
  });

  test("Backspace works board-wide — even from a non-grid button", async () => {
    const screen = await renderBoardViewer(TWO_TILE_BOARD);
    await screen.getByRole("button", { name: "hello" }).click();
    await screen.getByRole("button", { name: "world" }).click();

    screen.getByRole("button", { name: "Play message" }).element().focus();
    await userEvent.keyboard("{Backspace}");

    speech.speak.mockClear();
    await screen.getByRole("button", { name: "Play message" }).click();

    await vi.waitFor(() => {
      expect(speech.speak.mock.calls[0][0].text).toBe("hello");
    });
  });

  test("⌘+Enter speaks the message", async () => {
    const screen = await renderBoardViewer(TWO_TILE_BOARD);
    await screen.getByRole("button", { name: "hello" }).click();
    await screen.getByRole("button", { name: "world" }).click();

    speech.speak.mockClear();
    screen.getByRole("button", { name: "world" }).element().focus();
    await userEvent.keyboard("{Meta>}{Enter}{/Meta}");

    await vi.waitFor(() => {
      expect(speech.speak.mock.calls).toHaveLength(1);
      expect(speech.speak.mock.calls[0][0].text).toBe("hello world");
    });
  });

  test("Escape stops playback in progress", async () => {
    const screen = await renderBoardViewer(TWO_TILE_BOARD);
    await screen.getByRole("button", { name: "hello" }).click();

    preventSpeechEnd(speech.speak);

    await screen.getByRole("button", { name: "Play message" }).click();
    await expect
      .element(screen.getByRole("button", { name: "Stop" }))
      .toBeVisible();

    screen.getByRole("button", { name: "world" }).element().focus();
    await userEvent.keyboard("{Escape}");

    await expect
      .element(screen.getByRole("button", { name: "Play message" }))
      .toBeVisible();
  });
});
