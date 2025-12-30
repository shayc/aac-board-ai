import type { MessagePart } from "@features/board/hooks/useMessage";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { MessageBar } from "./MessageBar";

describe("MessageBar", () => {
  test("renders multiple message parts in correct order", async () => {
    const onBackspacePress = vi.fn();
    const onBackspaceLongPress = vi.fn();
    const onPlayClick = vi.fn();
    const onStopClick = vi.fn();

    const messageParts: MessagePart[] = [
      { id: "1", label: "I" },
      { id: "2", label: "want" },
      { id: "3", label: "water" },
    ];

    const screen = await render(
      <MessageBar
        message={messageParts}
        isPlaying={false}
        onBackspacePress={onBackspacePress}
        onBackspaceLongPress={onBackspaceLongPress}
        onPlayClick={onPlayClick}
        onStopClick={onStopClick}
      />,
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

  test("renders empty message with controls available", async () => {
    const onBackspacePress = vi.fn();
    const onBackspaceLongPress = vi.fn();
    const onPlayClick = vi.fn();
    const onStopClick = vi.fn();

    const screen = await render(
      <MessageBar
        message={[]}
        isPlaying={false}
        onBackspacePress={onBackspacePress}
        onBackspaceLongPress={onBackspaceLongPress}
        onPlayClick={onPlayClick}
        onStopClick={onStopClick}
      />,
    );

    await expect
      .element(screen.getByRole("button", { name: "Backspace" }))
      .toBeVisible();

    await expect
      .element(screen.getByRole("button", { name: "Play message" }))
      .toBeVisible();
  });

  test("clicking backspace button calls onBackspacePress", async () => {
    const onBackspacePress = vi.fn();
    const onBackspaceLongPress = vi.fn();
    const onPlayClick = vi.fn();
    const onStopClick = vi.fn();

    const screen = await render(
      <MessageBar
        message={[{ id: "1", label: "Test" }]}
        isPlaying={false}
        onBackspacePress={onBackspacePress}
        onBackspaceLongPress={onBackspaceLongPress}
        onPlayClick={onPlayClick}
        onStopClick={onStopClick}
      />,
    );

    const backspaceButton = screen.getByRole("button", { name: "Backspace" });
    await backspaceButton.click();

    expect(onBackspacePress).toHaveBeenCalledTimes(1);
  });

  test("clicking play button calls onPlayClick when not playing", async () => {
    const onBackspacePress = vi.fn();
    const onBackspaceLongPress = vi.fn();
    const onPlayClick = vi.fn();
    const onStopClick = vi.fn();

    const screen = await render(
      <MessageBar
        message={[{ id: "1", label: "Test" }]}
        isPlaying={false}
        onBackspacePress={onBackspacePress}
        onBackspaceLongPress={onBackspaceLongPress}
        onPlayClick={onPlayClick}
        onStopClick={onStopClick}
      />,
    );

    const playButton = screen.getByRole("button", { name: "Play message" });
    await playButton.click();

    expect(onPlayClick).toHaveBeenCalledTimes(1);
    expect(onStopClick).not.toHaveBeenCalled();
  });

  test("clicking stop button calls onStopClick when playing", async () => {
    const onBackspacePress = vi.fn();
    const onBackspaceLongPress = vi.fn();
    const onPlayClick = vi.fn();
    const onStopClick = vi.fn();

    const screen = await render(
      <MessageBar
        message={[{ id: "1", label: "Test" }]}
        isPlaying={true}
        onBackspacePress={onBackspacePress}
        onBackspaceLongPress={onBackspaceLongPress}
        onPlayClick={onPlayClick}
        onStopClick={onStopClick}
      />,
    );

    const stopButton = screen.getByRole("button", { name: "Stop playback" });
    await stopButton.click();

    expect(onStopClick).toHaveBeenCalledTimes(1);
    expect(onPlayClick).not.toHaveBeenCalled();
  });

  test("play button aria-label changes based on playing state", async () => {
    const onBackspacePress = vi.fn();
    const onBackspaceLongPress = vi.fn();
    const onPlayClick = vi.fn();
    const onStopClick = vi.fn();

    const screen = await render(
      <MessageBar
        message={[]}
        isPlaying={false}
        onBackspacePress={onBackspacePress}
        onBackspaceLongPress={onBackspaceLongPress}
        onPlayClick={onPlayClick}
        onStopClick={onStopClick}
      />,
    );

    const playButton = screen.getByRole("button", { name: "Play message" });
    await expect.element(playButton).toBeVisible();

    const { rerender } = screen;
    await rerender(
      <MessageBar
        message={[]}
        isPlaying={true}
        onBackspacePress={onBackspacePress}
        onBackspaceLongPress={onBackspaceLongPress}
        onPlayClick={onPlayClick}
        onStopClick={onStopClick}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Play message" }).query(),
    ).toBeNull();

    await expect
      .element(screen.getByRole("button", { name: "Stop playback" }))
      .toBeVisible();
  });
});
