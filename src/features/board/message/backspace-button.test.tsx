import { assertDefined } from "@shared/testing/assert-defined";
import { renderWithProviders } from "@shared/testing/render-with-providers";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { BackspaceButton } from "./backspace-button";

function createHandlers() {
  return {
    onPress: vi.fn(),
    onLongPress: vi.fn(),
  };
}

// React Aria needs nonzero mouse pressure to start its long-press timer.
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

    const screen = await renderWithProviders(<BackspaceButton {...handlers} />);

    const button = screen.getByRole("button", { name: "Backspace" });
    await button.click();

    expect(handlers.onPress).toHaveBeenCalledTimes(1);
    expect(handlers.onLongPress).not.toHaveBeenCalled();
  });

  test("calls onLongPress when long-pressed", async () => {
    const handlers = createHandlers();

    const screen = await renderWithProviders(<BackspaceButton {...handlers} />);

    const button = screen.getByRole("button", { name: "Backspace" });
    longPress(button.element());

    expect(handlers.onLongPress).toHaveBeenCalledTimes(1);
    expect(handlers.onPress).not.toHaveBeenCalled();
  });

  test("stays focusable and ignores presses while disabled", async () => {
    const handlers = createHandlers();

    const screen = await renderWithProviders(
      <BackspaceButton {...handlers} disabled />,
    );

    const button = screen.getByRole("button", { name: "Backspace" });
    await expect.element(button).toHaveAttribute("aria-disabled", "true");

    button.element().focus();
    await expect.element(button).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    longPress(button.element());

    expect(handlers.onPress).not.toHaveBeenCalled();
    expect(handlers.onLongPress).not.toHaveBeenCalled();
  });

  test.each([
    { direction: "rtl", transform: "matrix(-1, 0, 0, 1, 0, 0)" },
    { direction: "ltr", transform: "none" },
  ] as const)(
    "points the backspace icon toward the reading start in $direction",
    async ({ direction, transform }) => {
      const screen = await renderWithProviders(
        <div dir={direction}>
          <BackspaceButton {...createHandlers()} />
        </div>,
      );
      const icon = screen
        .getByRole("button", { name: "Backspace" })
        .element()
        .querySelector("svg");

      assertDefined(icon);
      expect(getComputedStyle(icon).transform).toBe(transform);
    },
  );
});
