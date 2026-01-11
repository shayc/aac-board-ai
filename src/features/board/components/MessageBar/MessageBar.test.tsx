import type { MessagePart } from "@features/board/hooks/useMessage";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { MessageBar } from "./MessageBar";
import { LONG_PRESS_THRESHOLD_MS } from "./components/BackspaceButton";

function createHandlers() {
  return {
    onBackspacePress: vi.fn(),
    onBackspaceLongPress: vi.fn(),
    onPlayClick: vi.fn(),
    onStopClick: vi.fn(),
  };
}

describe("MessageBar", () => {
  test("renders empty message with controls available", async () => {
    const handlers = createHandlers();

    const screen = await render(
      <MessageBar message={[]} isPlaying={false} {...handlers} />,
    );

    await expect
      .element(screen.getByRole("button", { name: "Backspace" }))
      .toBeVisible();

    await expect
      .element(screen.getByRole("button", { name: "Play message" }))
      .toBeVisible();
  });

  test("renders multiple message parts in correct order", async () => {
    const handlers = createHandlers();

    const messageParts: MessagePart[] = [
      { id: "1", label: "I" },
      { id: "2", label: "want" },
      { id: "3", label: "water" },
    ];

    const screen = await render(
      <MessageBar message={messageParts} isPlaying={false} {...handlers} />,
    );

    await expect.element(screen.getByText("I")).toBeVisible();
    await expect.element(screen.getByText("want")).toBeVisible();
    await expect.element(screen.getByText("water")).toBeVisible();

    const allText = screen.container.textContent ?? "";
    const iIndex = allText.indexOf("I");
    const wantIndex = allText.indexOf("want");
    const waterIndex = allText.indexOf("water");

    expect(iIndex).toBeGreaterThan(-1);
    expect(wantIndex).toBeGreaterThan(-1);
    expect(waterIndex).toBeGreaterThan(-1);
    expect(iIndex).toBeLessThan(wantIndex);
    expect(wantIndex).toBeLessThan(waterIndex);
  });

  test("play button aria-label changes based on playing state", async () => {
    const handlers = createHandlers();

    const screen = await render(
      <MessageBar message={[]} isPlaying={false} {...handlers} />,
    );

    const playButton = screen.getByRole("button", { name: "Play message" });
    await expect.element(playButton).toBeVisible();

    const { rerender } = screen;
    await rerender(<MessageBar message={[]} isPlaying={true} {...handlers} />);

    expect(
      screen.getByRole("button", { name: "Play message" }).query(),
    ).toBeNull();

    await expect
      .element(screen.getByRole("button", { name: "Stop playback" }))
      .toBeVisible();
  });

  test("clicking backspace button calls onBackspacePress", async () => {
    const handlers = createHandlers();

    const screen = await render(
      <MessageBar
        message={[{ id: "1", label: "Test" }]}
        isPlaying={false}
        {...handlers}
      />,
    );

    const backspaceButton = screen.getByRole("button", { name: "Backspace" });
    await backspaceButton.click();

    expect(handlers.onBackspacePress).toHaveBeenCalledTimes(1);
    expect(handlers.onBackspaceLongPress).not.toHaveBeenCalled();
  });

  test("clicking play button calls onPlayClick when not playing", async () => {
    const handlers = createHandlers();

    const screen = await render(
      <MessageBar
        message={[{ id: "1", label: "Test" }]}
        isPlaying={false}
        {...handlers}
      />,
    );

    const playButton = screen.getByRole("button", { name: "Play message" });
    await playButton.click();

    expect(handlers.onPlayClick).toHaveBeenCalledTimes(1);
    expect(handlers.onStopClick).not.toHaveBeenCalled();
  });

  test("clicking stop button calls onStopClick when playing", async () => {
    const handlers = createHandlers();

    const screen = await render(
      <MessageBar
        message={[{ id: "1", label: "Test" }]}
        isPlaying={true}
        {...handlers}
      />,
    );

    const stopButton = screen.getByRole("button", { name: "Stop playback" });
    await stopButton.click();

    expect(handlers.onStopClick).toHaveBeenCalledTimes(1);
    expect(handlers.onPlayClick).not.toHaveBeenCalled();
  });

  test("long-pressing backspace button calls onBackspaceLongPress", async () => {
    const handlers = createHandlers();

    const screen = await render(
      <MessageBar
        message={[{ id: "1", label: "Test" }]}
        isPlaying={false}
        {...handlers}
      />,
    );

    const backspaceButton = screen.getByRole("button", { name: "Backspace" });

    await backspaceButton.click({
      delay: LONG_PRESS_THRESHOLD_MS,
    });

    expect(handlers.onBackspaceLongPress).toHaveBeenCalledTimes(1);
    expect(handlers.onBackspacePress).not.toHaveBeenCalled();
  });
});
