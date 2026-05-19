import {
  createTheme,
  ThemeProvider as MUIThemeProvider,
} from "@mui/material/styles";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { BackspaceButton } from "./backspace-button";

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

  describe("RTL icon mirroring", () => {
    test("backspace icon is flipped in RTL", async () => {
      const theme = createTheme({ direction: "rtl" });
      const handlers = createHandlers();

      const screen = await render(
        <MUIThemeProvider theme={theme}>
          <BackspaceButton {...handlers} />
        </MUIThemeProvider>,
      );

      const button = screen.getByRole("button", { name: "Backspace" });
      const icon = button.element().querySelector("svg");

      expect(icon).not.toBeNull();
      // Browsers resolve scaleX(-1) to its matrix equivalent
      const styles = getComputedStyle(icon!);
      expect(styles.transform).toBe("matrix(-1, 0, 0, 1, 0, 0)");
    });

    test("backspace icon is not flipped in LTR", async () => {
      const theme = createTheme({ direction: "ltr" });
      const handlers = createHandlers();

      const screen = await render(
        <MUIThemeProvider theme={theme}>
          <BackspaceButton {...handlers} />
        </MUIThemeProvider>,
      );

      const button = screen.getByRole("button", { name: "Backspace" });
      const icon = button.element().querySelector("svg");

      expect(icon).not.toBeNull();
      const styles = getComputedStyle(icon!);
      expect(styles.transform).not.toBe("matrix(-1, 0, 0, 1, 0, 0)");
    });
  });
});
