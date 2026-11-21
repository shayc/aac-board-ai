import { assertDefined } from "@shared/testing/assert-defined";
import { contrastRatio, paint } from "@shared/testing/contrast";
import {
  type ColorMode,
  renderInColorMode,
} from "@shared/testing/render-in-color-mode";
import { renderWithProviders } from "@shared/testing/render-with-providers";
import { describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { BackspaceButton } from "../message/backspace-button";
import { MessageBar } from "../message/message-bar";
import { PlayButton } from "./play-button";

const SHORTCUT_LABELS = { play: "⌘↩", stop: "Esc" };
const BACKSPACE_SHORTCUT_LABELS = {
  clear: "⌘⌫",
  spokenClear: "Command+Delete",
};

function createHandlers() {
  return {
    onPlay: vi.fn(),
    onStop: vi.fn(),
  };
}

// Measures each disabled glyph where it is seen: play's over its own tint,
// backspace's straight on the bar, both against the bar.
async function measureDisabledGlyphContrasts(mode: ColorMode) {
  const screen = await renderInColorMode(
    <MessageBar
      parts={[]}
      isWordOpen={false}
      activePartId={null}
      areImagesVisible
      endAction={
        <>
          <BackspaceButton
            disabled
            shortcutLabels={BACKSPACE_SHORTCUT_LABELS}
            onPress={vi.fn()}
            onLongPress={vi.fn()}
          />
          <PlayButton
            disabled
            isPlaying={false}
            shortcutLabels={SHORTCUT_LABELS}
            {...createHandlers()}
          />
        </>
      }
    />,
    mode,
  );

  const play = screen.getByRole("button", { name: "Speak message" }).element();
  const backspace = screen.getByRole("button", { name: "Backspace" }).element();

  const bar = play.parentElement;
  assertDefined(bar);
  const barColor = getComputedStyle(bar).backgroundColor;
  const playStyle = getComputedStyle(play);
  const playGlyph = paint(barColor, playStyle.backgroundColor, playStyle.color);
  const backspaceGlyph = paint(barColor, getComputedStyle(backspace).color);
  await screen.unmount();

  const ground = paint(barColor);

  return {
    play: contrastRatio(playGlyph, ground),
    backspace: contrastRatio(backspaceGlyph, ground),
  };
}

describe("PlayButton", () => {
  test("calls onPlay while idle", async () => {
    const handlers = createHandlers();

    const screen = await renderWithProviders(
      <PlayButton
        shortcutLabels={SHORTCUT_LABELS}
        isPlaying={false}
        {...handlers}
      />,
    );

    await screen.getByRole("button", { name: "Speak message" }).click();

    expect(handlers.onPlay).toHaveBeenCalledTimes(1);
    expect(handlers.onStop).not.toHaveBeenCalled();
  });

  test("calls onStop while playing", async () => {
    const handlers = createHandlers();

    const screen = await renderWithProviders(
      <PlayButton shortcutLabels={SHORTCUT_LABELS} isPlaying {...handlers} />,
    );

    await screen.getByRole("button", { name: "Stop speaking" }).click();

    expect(handlers.onStop).toHaveBeenCalledTimes(1);
    expect(handlers.onPlay).not.toHaveBeenCalled();
  });

  test("keeps focus and ignores activation once disabled", async () => {
    const handlers = createHandlers();
    const screen = await renderWithProviders(
      <PlayButton
        shortcutLabels={SHORTCUT_LABELS}
        isPlaying={false}
        {...handlers}
      />,
    );
    const play = screen.getByRole("button", { name: "Speak message" });
    play.element().focus();
    await expect.element(play).toHaveFocus();

    await screen.rerender(
      <PlayButton
        shortcutLabels={SHORTCUT_LABELS}
        disabled
        isPlaying={false}
        {...handlers}
      />,
    );

    await expect.element(play).toHaveAttribute("aria-disabled", "true");
    await expect.element(play).toHaveFocus();

    await userEvent.keyboard("{Enter}");

    expect(handlers.onPlay).not.toHaveBeenCalled();
  });

  test("shows the play shortcut when focused from the keyboard", async () => {
    const screen = await renderWithProviders(
      <PlayButton
        shortcutLabels={SHORTCUT_LABELS}
        isPlaying={false}
        {...createHandlers()}
      />,
    );
    const play = screen.getByRole("button", { name: "Speak message" });

    await userEvent.tab();

    const tooltip = screen.getByRole("tooltip");
    await expect.element(tooltip).toBeInTheDocument();
    expect(tooltip.element().textContent).toBe(
      "Speak message (\u2066⌘↩\u2069)",
    );
    await expect
      .element(play)
      .toHaveAttribute("aria-keyshortcuts", "Meta+Enter Control+Enter");
  });

  test("shows the stop shortcut while playing", async () => {
    const screen = await renderWithProviders(
      <PlayButton
        shortcutLabels={SHORTCUT_LABELS}
        isPlaying
        shape="pill"
        {...createHandlers()}
      />,
    );
    const stop = screen.getByRole("button", { name: "Stop speaking" });

    await userEvent.tab();

    const tooltip = screen.getByRole("tooltip");
    await expect.element(tooltip).toBeInTheDocument();
    expect(tooltip.element().textContent).toBe(
      "Stop speaking (\u2066Esc\u2069)",
    );
    await expect.element(stop).toHaveAttribute("aria-keyshortcuts", "Escape");
  });
});

describe("PlayButton in an empty message bar", () => {
  test.each(["light", "dark"] as const)(
    "keeps its disabled glyph at least as visible as backspace's in %s mode",
    async (mode) => {
      const { play, backspace } = await measureDisabledGlyphContrasts(mode);

      expect(play).toBeGreaterThanOrEqual(backspace);
    },
  );
});
