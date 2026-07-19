import { AppProviders } from "@shared/providers/app-providers";
import { createRef, type ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { PlayButton } from "./play-button";

function renderWithProviders(children: ReactNode) {
  return render(<AppProviders>{children}</AppProviders>);
}

function createHandlers() {
  return {
    onPlayClick: vi.fn(),
    onStopClick: vi.fn(),
  };
}

describe("PlayButton", () => {
  test("forwards root element props and refs", async () => {
    const handlers = createHandlers();
    const ref = createRef<HTMLButtonElement>();
    const screen = await renderWithProviders(
      <PlayButton
        {...handlers}
        ref={ref}
        data-scan-target=""
        isPlaying={false}
      />,
    );

    const button = screen.getByRole("button", { name: "Play message" });
    await expect.element(button).toHaveAttribute("data-scan-target", "");
    expect(ref.current).toBe(button.element());
  });

  test("calls onPlayClick when clicked while not playing", async () => {
    const handlers = createHandlers();

    const screen = await renderWithProviders(
      <PlayButton isPlaying={false} {...handlers} />,
    );

    const button = screen.getByRole("button", { name: "Play message" });
    await button.click();

    expect(handlers.onPlayClick).toHaveBeenCalledTimes(1);
    expect(handlers.onStopClick).not.toHaveBeenCalled();
  });

  test("calls onStopClick when clicked while playing", async () => {
    const handlers = createHandlers();

    const screen = await renderWithProviders(
      <PlayButton isPlaying={true} {...handlers} />,
    );

    const button = screen.getByRole("button", { name: "Stop message" });
    await button.click();

    expect(handlers.onStopClick).toHaveBeenCalledTimes(1);
    expect(handlers.onPlayClick).not.toHaveBeenCalled();
  });
});
