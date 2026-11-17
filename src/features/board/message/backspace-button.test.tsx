import { useColorScheme } from "@mui/material/styles";
import { assertDefined } from "@shared/testing/assert-defined";
import {
  contrastRatio,
  paint,
  WCAG_NON_TEXT_CONTRAST,
  WCAG_TEXT_CONTRAST,
} from "@shared/testing/contrast";
import { renderWithProviders } from "@shared/testing/render-with-providers";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { BackspaceButton } from "./backspace-button";
import { MESSAGE_ACTION_SIZE, MessageBar } from "./message-bar";

const SHORTCUT_LABELS = { clear: "⌘⌫", spokenClear: "Command+Delete" };
const TRANSPARENT = "rgba(0, 0, 0, 0)";

type ColorMode = "light" | "dark";

function createHandlers() {
  return {
    onPress: vi.fn(),
    onLongPress: vi.fn(),
  };
}

function longPress(element: Element) {
  pressDown(element);
  vi.advanceTimersByTime(700);
  element.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
}

// React Aria needs nonzero mouse pressure to start its long-press timer.
function pressDown(element: Element) {
  element.dispatchEvent(
    new PointerEvent("pointerdown", {
      bubbles: true,
      button: 0,
      pointerType: "mouse",
      pressure: 0.5,
    }),
  );
}

// Clearing the message disables backspace while the pointer is still down.
function ClearableBackspace() {
  const [isCleared, setIsCleared] = useState(false);

  return (
    <BackspaceButton
      shortcutLabels={SHORTCUT_LABELS}
      disabled={isCleared}
      onPress={() => {}}
      onLongPress={() => setIsCleared(true)}
    />
  );
}

// The button has no fill at rest, so the icon and ring are measured against
// the bar it sits on.
async function measureContrasts(mode: ColorMode, disabled: boolean) {
  const screen = await renderWithProviders(
    <>
      <ColorModeSwitch mode={mode} />
      <MessageBar
        parts={[]}
        isWordOpen={false}
        activePartId={null}
        areImagesVisible
        endAction={
          <BackspaceButton
            shortcutLabels={SHORTCUT_LABELS}
            {...createHandlers()}
            disabled={disabled}
          />
        }
      />
    </>,
  );
  await screen.getByRole("button", { name: `Use ${mode} mode` }).click();
  await expect.poll(() => document.documentElement.className).toBe(mode);

  const button = screen.getByRole("button", { name: "Backspace" }).element();
  // Switching modes animates the colors; measure where they settle.
  await Promise.all(
    button.getAnimations({ subtree: true }).map(({ finished }) => finished),
  );

  const bar = button.parentElement;
  assertDefined(bar);
  const barColor = getComputedStyle(bar).backgroundColor;
  const { backgroundColor, color: iconColor } = getComputedStyle(button);
  const ring = button.querySelector("circle");
  assertDefined(ring);
  const ringColor = getComputedStyle(ring).stroke;
  await screen.unmount();

  const ground = paint(barColor, backgroundColor);

  return {
    icon: contrastRatio(paint(barColor, backgroundColor, iconColor), ground),
    ring: contrastRatio(paint(barColor, backgroundColor, ringColor), ground),
  };
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

    const screen = await renderWithProviders(
      <BackspaceButton shortcutLabels={SHORTCUT_LABELS} {...handlers} />,
    );

    const button = screen.getByRole("button", { name: "Backspace" });
    await button.click();

    expect(handlers.onPress).toHaveBeenCalledTimes(1);
    expect(handlers.onLongPress).not.toHaveBeenCalled();
  });

  test("calls onLongPress when long-pressed", async () => {
    const handlers = createHandlers();

    const screen = await renderWithProviders(
      <BackspaceButton shortcutLabels={SHORTCUT_LABELS} {...handlers} />,
    );

    const button = screen.getByRole("button", { name: "Backspace" });
    longPress(button.element());

    expect(handlers.onLongPress).toHaveBeenCalledTimes(1);
    expect(handlers.onPress).not.toHaveBeenCalled();
  });

  test("fills the ring while held and empties it on release", async () => {
    const screen = await renderWithProviders(
      <BackspaceButton
        shortcutLabels={SHORTCUT_LABELS}
        {...createHandlers()}
      />,
    );
    const button = screen.getByRole("button", { name: "Backspace" }).element();
    const ring = button.querySelector<HTMLElement>("[role=progressbar]");
    assertDefined(ring);

    pressDown(button);

    await expect.element(ring).toHaveAttribute("aria-valuenow", "100");

    button.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));

    await expect.element(ring).toHaveAttribute("aria-valuenow", "0");
  });

  test("empties the ring when a hold clears the message", async () => {
    const screen = await renderWithProviders(<ClearableBackspace />);
    const button = screen.getByRole("button", { name: "Backspace" }).element();
    const ring = button.querySelector<HTMLElement>("[role=progressbar]");
    assertDefined(ring);

    longPress(button);

    await expect.element(ring).toHaveAttribute("aria-valuenow", "0");
  });

  test("stays focusable and ignores presses while disabled", async () => {
    const handlers = createHandlers();

    const screen = await renderWithProviders(
      <BackspaceButton
        shortcutLabels={SHORTCUT_LABELS}
        {...handlers}
        disabled
      />,
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
          <BackspaceButton
            shortcutLabels={SHORTCUT_LABELS}
            {...createHandlers()}
          />
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

describe("BackspaceButton shortcut hints", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("shows the clear shortcut when focused from the keyboard", async () => {
    const screen = await renderWithProviders(
      <BackspaceButton
        shortcutLabels={SHORTCUT_LABELS}
        {...createHandlers()}
      />,
    );

    await userEvent.tab();

    const tooltip = screen.getByRole("tooltip");
    await expect.element(tooltip).toBeInTheDocument();
    expect(tooltip.element().textContent).toBe(
      "Clear message (\u2066⌘⌫\u2069)",
    );
  });

  test("keeps the shortcut tooltip closed on hover", async () => {
    vi.useFakeTimers();
    const screen = await renderWithProviders(
      <BackspaceButton
        shortcutLabels={SHORTCUT_LABELS}
        {...createHandlers()}
      />,
    );
    const button = screen.getByRole("button", { name: "Backspace" });

    await button.hover();
    await vi.advanceTimersByTimeAsync(1000);

    expect(screen.getByRole("tooltip").query()).toBeNull();

    await userEvent.tab();
    await vi.advanceTimersByTimeAsync(1000);

    await expect.element(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  test("names the clear shortcut in the hint and its own key", async () => {
    const screen = await renderWithProviders(
      <BackspaceButton
        shortcutLabels={SHORTCUT_LABELS}
        {...createHandlers()}
      />,
    );
    const button = screen.getByRole("button", { name: "Backspace" });

    await expect
      .element(button)
      .toHaveAccessibleDescription(
        "Hold, or press Command+Delete, to clear the message.",
      );
    await expect
      .element(button)
      .toHaveAttribute("aria-keyshortcuts", "Backspace");
  });
});

describe("BackspaceButton colors", () => {
  test.each(["light", "dark"] as const)(
    "draws the icon in %s mode with text-level contrast",
    async (mode) => {
      const { icon } = await measureContrasts(mode, false);

      expect(icon).toBeGreaterThan(WCAG_TEXT_CONTRAST);
    },
  );

  // The ring is the only cue that a hold will clear the message.
  test.each(["light", "dark"] as const)(
    "draws the hold ring in %s mode with non-text contrast",
    async (mode) => {
      const { ring } = await measureContrasts(mode, false);

      expect(ring).toBeGreaterThan(WCAG_NON_TEXT_CONTRAST);
    },
  );

  // Disabled controls are exempt from contrast minimums, but an empty message
  // must still show where backspace is, and the dark bar is greyer.
  test("keeps the disabled icon in dark mode at least as visible as in light mode", async () => {
    const { icon: light } = await measureContrasts("light", true);
    const { icon: dark } = await measureContrasts("dark", true);

    expect(dark).toBeGreaterThanOrEqual(light);
  });
});

describe("BackspaceButton in the message bar", () => {
  // Play is the bar's only filled shape; backspace shows a fill only as
  // feedback that the pointer is on it.
  test("has no fill until the pointer is on it", async () => {
    const screen = await renderWithProviders(
      <MessageBar
        parts={[]}
        isWordOpen={false}
        activePartId={null}
        areImagesVisible
        endAction={
          <BackspaceButton
            shortcutLabels={SHORTCUT_LABELS}
            {...createHandlers()}
          />
        }
      />,
    );
    const button = screen.getByRole("button", { name: "Backspace" });
    const readFill = () => getComputedStyle(button.element()).backgroundColor;

    await screen.getByRole("list", { name: "Message" }).hover();

    await expect.poll(readFill).toBe(TRANSPARENT);

    await button.hover();

    await expect.poll(readFill).not.toBe(TRANSPARENT);
  });

  // Nothing at rest marks the touch target's edge, so the hold ring must, and
  // the same gap on three sides keeps it parallel to the bar's rounded end.
  test("traces its touch target with the ring, evenly inset in the bar's end", async () => {
    const screen = await renderWithProviders(
      <MessageBar
        parts={[]}
        isWordOpen={false}
        activePartId={null}
        areImagesVisible
        endAction={
          <BackspaceButton
            shortcutLabels={SHORTCUT_LABELS}
            {...createHandlers()}
          />
        }
      />,
    );
    const button = screen.getByRole("button", { name: "Backspace" }).element();
    const bar = button.parentElement;
    assertDefined(bar);
    const ring = button.querySelector("[role=progressbar]");
    assertDefined(ring);

    const target = button.getBoundingClientRect();
    const barEdges = bar.getBoundingClientRect();
    const ringEdges = ring.getBoundingClientRect();
    const gap = target.top - barEdges.top;

    expect(target.width).toBe(MESSAGE_ACTION_SIZE);
    expect(ringEdges.toJSON()).toEqual(target.toJSON());
    expect(barEdges.bottom - target.bottom).toBeCloseTo(gap, 0);
    expect(barEdges.right - target.right).toBeCloseTo(gap, 0);
  });
});
