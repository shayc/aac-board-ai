import { useColorScheme } from "@mui/material/styles";
import { assertDefined } from "@shared/testing/assert-defined";
import {
  contrastRatio,
  paint,
  WCAG_TEXT_CONTRAST,
} from "@shared/testing/contrast";
import { renderWithProviders } from "@shared/testing/render-with-providers";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { BackspaceButton } from "./backspace-button";
import { MessageBar } from "./message-bar";

type ColorMode = "light" | "dark";

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

// The disc is translucent, so the icon is measured against the bar it sits on.
async function measureIconContrast(mode: ColorMode, disabled: boolean) {
  const screen = await renderWithProviders(
    <>
      <ColorModeSwitch mode={mode} />
      <MessageBar
        parts={[]}
        language="en"
        isWordOpen={false}
        activePartId={null}
        areImagesVisible
        endAction={
          <BackspaceButton {...createHandlers()} disabled={disabled} />
        }
      />
    </>,
  );
  await screen.getByRole("button", { name: `Use ${mode} mode` }).click();
  await expect.poll(() => document.documentElement.className).toBe(mode);

  const button = screen.getByRole("button", { name: "Backspace" }).element();
  // Switching modes animates the disc; measure where it settles.
  await Promise.all(
    button.getAnimations({ subtree: true }).map(({ finished }) => finished),
  );

  const bar = button.parentElement;
  assertDefined(bar);
  const barColor = getComputedStyle(bar).backgroundColor;
  const { backgroundColor: discColor, color: iconColor } =
    getComputedStyle(button);
  await screen.unmount();

  return contrastRatio(
    paint(barColor, discColor, iconColor),
    paint(barColor, discColor),
  );
}

function ColorModeSwitch({ mode }: { mode: ColorMode }) {
  const { setMode } = useColorScheme();

  return (
    <button type="button" onClick={() => setMode(mode)}>
      Use {mode} mode
    </button>
  );
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

  test("fills the ring while held and empties it on release", async () => {
    const screen = await renderWithProviders(
      <BackspaceButton {...createHandlers()} />,
    );
    const button = screen.getByRole("button", { name: "Backspace" }).element();
    const ring = button.querySelector<HTMLElement>("[role=progressbar]");
    assertDefined(ring);

    button.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        pointerType: "mouse",
        pressure: 0.5,
      }),
    );

    await expect.element(ring).toHaveAttribute("aria-valuenow", "100");

    button.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));

    await expect.element(ring).toHaveAttribute("aria-valuenow", "0");
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

describe("BackspaceButton colors", () => {
  test.each(["light", "dark"] as const)(
    "draws the icon in %s mode with text-level contrast",
    async (mode) => {
      const contrast = await measureIconContrast(mode, false);

      expect(contrast).toBeGreaterThan(WCAG_TEXT_CONTRAST);
    },
  );

  // Disabled controls are exempt from contrast minimums, but an empty message
  // must still show where backspace is, and the dark bar is greyer.
  test("keeps the disabled icon in dark mode at least as visible as in light mode", async () => {
    const light = await measureIconContrast("light", true);
    const dark = await measureIconContrast("dark", true);

    expect(dark).toBeGreaterThanOrEqual(light);
  });
});
