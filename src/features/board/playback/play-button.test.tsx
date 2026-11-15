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

  test("shows the play shortcut when focused from the keyboard", async () => {
    const screen = await renderWithProviders(
      <PlayButton isPlaying={false} {...createHandlers()} />,
    );
    const play = screen.getByRole("button", { name: "Play message" });

    await userEvent.tab();

    const tooltip = screen.getByRole("tooltip");
    await expect.element(tooltip).toBeInTheDocument();
    expect(tooltip.element().textContent).toMatch(/^Play message \(.+\)$/);
    await expect
      .element(play)
      .toHaveAttribute("aria-keyshortcuts", "Meta+Enter Control+Enter");
  });

  test("shows the stop shortcut while playing", async () => {
    const screen = await renderWithProviders(
      <PlayButton isPlaying variant="boardControl" {...createHandlers()} />,
    );
    const stop = screen.getByRole("button", { name: "Stop message" });

    await userEvent.tab();

    const tooltip = screen.getByRole("tooltip");
    await expect.element(tooltip).toBeInTheDocument();
    expect(tooltip.element().textContent).toBe(
      "Stop message (\u2066Esc\u2069)",
    );
    await expect.element(stop).toHaveAttribute("aria-keyshortcuts", "Escape");
  });
});
