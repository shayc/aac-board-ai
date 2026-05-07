import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { BackspaceButton, LONG_PRESS_THRESHOLD_MS } from "./BackspaceButton";

function createHandlers() {
  return {
    onPress: vi.fn(),
    onLongPress: vi.fn(),
  };
}

describe("BackspaceButton", () => {
  test("calls onPress when clicked", async () => {
    const handlers = createHandlers();

    const screen = await render(<BackspaceButton {...handlers} />);

    const button = screen.getByRole("button", { name: "Backspace" });
    await button.click();

    expect(handlers.onPress).toHaveBeenCalledTimes(1);
    expect(handlers.onLongPress).not.toHaveBeenCalled();
  });

  test("calls onLongPress when long-pressed", async () => {
    const handlers = createHandlers();

    const screen = await render(<BackspaceButton {...handlers} />);

    const button = screen.getByRole("button", { name: "Backspace" });
    await button.click({ delay: LONG_PRESS_THRESHOLD_MS + 100 });

    expect(handlers.onLongPress).toHaveBeenCalledTimes(1);
    expect(handlers.onPress).not.toHaveBeenCalled();
  });
});
