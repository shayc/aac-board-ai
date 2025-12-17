import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { PlayButton } from "./PlayButton";

test("calls onPlayClick when clicked while not playing", async () => {
  const onPlayClick = vi.fn();
  const onStopClick = vi.fn();

  const screen = await render(
    <PlayButton
      isPlaying={false}
      onPlayClick={onPlayClick}
      onStopClick={onStopClick}
    />,
  );

  const button = screen.getByRole("button", { name: "Play message" });
  await button.click();

  expect(onPlayClick).toHaveBeenCalledTimes(1);
  expect(onStopClick).not.toHaveBeenCalled();
});

test("calls onStopClick when clicked while playing", async () => {
  const onPlayClick = vi.fn();
  const onStopClick = vi.fn();

  const screen = await render(
    <PlayButton
      isPlaying={true}
      onPlayClick={onPlayClick}
      onStopClick={onStopClick}
    />,
  );

  const button = screen.getByRole("button", { name: "Stop playback" });
  await button.click();

  expect(onStopClick).toHaveBeenCalledTimes(1);
  expect(onPlayClick).not.toHaveBeenCalled();
});

test("changes label when isPlaying state changes", async () => {
  const onPlayClick = vi.fn();
  const onStopClick = vi.fn();

  const screen = await render(
    <PlayButton
      isPlaying={false}
      onPlayClick={onPlayClick}
      onStopClick={onStopClick}
    />,
  );

  await expect
    .element(screen.getByRole("button", { name: "Play message" }))
    .toBeVisible();

  await screen.rerender(
    <PlayButton
      isPlaying={true}
      onPlayClick={onPlayClick}
      onStopClick={onStopClick}
    />,
  );

  await expect
    .element(screen.getByRole("button", { name: "Stop playback" }))
    .toBeVisible();
});
