import ListItemButton from "@mui/material/ListItemButton";
import { AppProviders } from "@shared/providers/app-providers";
import { assertDefined } from "@shared/testing/assert-defined";
import { contrastRatio } from "@shared/testing/contrast";
import { SettingsSlider } from "@shared/ui/settings-slider";
import { SettingsSwitch } from "@shared/ui/settings-switch";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { BACKGROUND_DARK, BACKGROUND_LIGHT } from "./theme-colors";

// WCAG 1.4.11 Non-text Contrast.
const MIN_CONTRAST = 3;

const SCHEMES = [
  { scheme: "light", background: BACKGROUND_LIGHT },
  { scheme: "dark", background: BACKGROUND_DARK },
] as const;

function renderControls(scheme: "light" | "dark") {
  return render(
    <AppProviders>
      <div className={scheme}>
        <SettingsSwitch label="Off" checked={false} onChange={vi.fn()} />
        <SettingsSwitch label="On" checked onChange={vi.fn()} />
        <SettingsSlider
          label="Speed"
          value={0.5}
          onChange={vi.fn()}
          min={0}
          max={2}
          step={0.1}
          normalValue={1}
          formatValue={String}
        />
        <ListItemButton selected>Selected</ListItemButton>
      </div>
    </AppProviders>,
  );
}

function backgroundColorOf(root: Element, selector: string): string {
  const element = root.querySelector(selector);
  assertDefined(element);

  return getComputedStyle(element).backgroundColor;
}

function switchRoot(label: Element): Element {
  const root = label.closest("label");
  assertDefined(root);

  return root;
}

describe.each(SCHEMES)(
  "non-text contrast in the $scheme scheme",
  ({ scheme, background }) => {
    test.each(["Off", "On"])(
      "shows a switch that is %s against the page and its thumb against the track",
      async (label) => {
        const screen = await renderControls(scheme);
        const root = switchRoot(screen.getByText(label).element());
        const track = backgroundColorOf(root, ".MuiSwitch-track");
        const thumb = backgroundColorOf(root, ".MuiSwitch-thumb");

        expect(contrastRatio(track, background)).toBeGreaterThanOrEqual(
          MIN_CONTRAST,
        );
        expect(contrastRatio(thumb, track)).toBeGreaterThanOrEqual(
          MIN_CONTRAST,
        );
      },
    );

    test("keeps a switch's thumb inside its track", async () => {
      const screen = await renderControls(scheme);
      const root = switchRoot(screen.getByText("Off").element());
      const track = root.querySelector(".MuiSwitch-track");
      const thumb = root.querySelector(".MuiSwitch-thumb");
      assertDefined(track);
      assertDefined(thumb);

      const trackBounds = track.getBoundingClientRect();
      const thumbBounds = thumb.getBoundingClientRect();
      expect(thumbBounds.top).toBeGreaterThanOrEqual(trackBounds.top);
      expect(thumbBounds.bottom).toBeLessThanOrEqual(trackBounds.bottom);
      expect(thumbBounds.left).toBeGreaterThanOrEqual(trackBounds.left);
      expect(thumbBounds.right).toBeLessThanOrEqual(trackBounds.right);
    });

    test("shows a slider's rail against the page and its normal-value mark against the rail", async () => {
      const screen = await renderControls(scheme);
      const rail = backgroundColorOf(screen.container, ".MuiSlider-rail");
      const mark = backgroundColorOf(screen.container, ".MuiSlider-mark");

      expect(contrastRatio(rail, background)).toBeGreaterThanOrEqual(
        MIN_CONTRAST,
      );
      expect(contrastRatio(mark, rail)).toBeGreaterThanOrEqual(MIN_CONTRAST);
    });

    test("marks the selected list item with a dot that shows against the page", async () => {
      const screen = await renderControls(scheme);
      const marker = getComputedStyle(
        screen.getByText("Selected").element(),
        "::after",
      );

      expect(marker.content).not.toBe("none");
      expect(marker.opacity).toBe("1");
      expect(parseFloat(marker.width)).toBeGreaterThan(0);
      expect(
        contrastRatio(marker.backgroundColor, background),
      ).toBeGreaterThanOrEqual(MIN_CONTRAST);
    });

    test("keeps the keyboard focus ring for focus alone", async () => {
      const screen = await renderControls(scheme);
      const selected = screen.getByText("Selected");

      expect(getComputedStyle(selected.element()).outlineStyle).toBe("none");

      // Tabs through the switches and the slider first.
      while (document.activeElement !== selected.element()) {
        await userEvent.tab();
      }

      expect(getComputedStyle(selected.element()).outlineStyle).toBe("solid");
    });
  },
);
