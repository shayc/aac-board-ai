import { renderWithProviders } from "@shared/testing/render-with-providers";
import { describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { PlayButton } from "./play-button";

function createHandlers() {
  return {
    onPlay: vi.fn(),
    onStop: vi.fn(),
  };
}

describe("PlayButton", () => {
  test("calls onPlay while idle", async () => {
    const handlers = createHandlers();

    const screen = await renderWithProviders(
      <PlayButton isPlaying={false} {...handlers} />,
    );

    await screen.getByRole("button", { name: "Play message" }).click();

    expect(handlers.onPlay).toHaveBeenCalledTimes(1);
    expect(handlers.onStop).not.toHaveBeenCalled();
  });

  test("calls onStop while playing", async () => {
    const handlers = createHandlers();

    const screen = await renderWithProviders(
      <PlayButton isPlaying {...handlers} />,
    );

    await screen.getByRole("button", { name: "Stop message" }).click();

    expect(handlers.onStop).toHaveBeenCalledTimes(1);
    expect(handlers.onPlay).not.toHaveBeenCalled();
  });

  test("keeps focus and ignores activation once disabled", async () => {
    const handlers = createHandlers();
    const screen = await renderWithProviders(
      <PlayButton isPlaying={false} {...handlers} />,
    );
    const play = screen.getByRole("button", { name: "Play message" });
    play.element().focus();
    await expect.element(play).toHaveFocus();

    await screen.rerender(
      <PlayButton disabled isPlaying={false} {...handlers} />,
    );

    await expect.element(play).toHaveAttribute("aria-disabled", "true");
    await expect.element(play).toHaveFocus();

    await userEvent.keyboard("{Enter}");

    expect(handlers.onPlay).not.toHaveBeenCalled();
  });
});
