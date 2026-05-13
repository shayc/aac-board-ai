import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { BackspaceButton } from "./BackspaceButton";

function createHandlers() {
  return {
    onPress: vi.fn(),
    onLongPress: vi.fn(),
  };
}

// pressure must be non-zero: react-aria treats pressure===0 + pointerType==="mouse"
// as a virtual (assistive-technology) event and skips the long-press timer entirely.
function longPress(element: Element) {
  element.dispatchEvent(
    new PointerEvent("pointerdown", {
      bubbles: true,
      button: 0,
      pointerType: "mouse",
      pressure: 0.5,
    }),
  );
  vi.advanceTimersByTime(700);
  element.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
}

describe("BackspaceButton", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

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
    longPress(button.element());

    expect(handlers.onLongPress).toHaveBeenCalledTimes(1);
    expect(handlers.onPress).not.toHaveBeenCalled();
  });
});
