import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { PlayButton } from "./PlayButton";

function createHandlers() {
  return {
    onPlayClick: vi.fn(),
    onStopClick: vi.fn(),
  };
}

describe("PlayButton", () => {
  test("calls onPlayClick when clicked while not playing", async () => {
    const handlers = createHandlers();

    const screen = await render(<PlayButton isPlaying={false} {...handlers} />);

    const button = screen.getByRole("button", { name: "Play message" });
    await button.click();

    expect(handlers.onPlayClick).toHaveBeenCalledTimes(1);
    expect(handlers.onStopClick).not.toHaveBeenCalled();
  });

  test("calls onStopClick when clicked while playing", async () => {
    const handlers = createHandlers();

    const screen = await render(<PlayButton isPlaying={true} {...handlers} />);

    const button = screen.getByRole("button", { name: "Stop playback" });
    await button.click();

    expect(handlers.onStopClick).toHaveBeenCalledTimes(1);
    expect(handlers.onPlayClick).not.toHaveBeenCalled();
  });

  test("changes label when isPlaying state changes", async () => {
    const handlers = createHandlers();

    const screen = await render(<PlayButton isPlaying={false} {...handlers} />);

    await expect
      .element(screen.getByRole("button", { name: "Play message" }))
      .toBeVisible();

    await screen.rerender(<PlayButton isPlaying={true} {...handlers} />);

    await expect
      .element(screen.getByRole("button", { name: "Stop playback" }))
      .toBeVisible();
  });
});
