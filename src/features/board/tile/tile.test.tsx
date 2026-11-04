import {
  createTheme,
  ThemeProvider as MUIThemeProvider,
} from "@mui/material/styles";
import { assertDefined } from "@shared/testing/assert-defined";
import type { CSSProperties, ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";
import type { Locator } from "vitest/browser";
import { render } from "vitest-browser-react";
import { AACSymbol } from "../aac-symbol/aac-symbol";
import { TEST_IMAGE_SRC } from "../testing";
import { Tile } from "./tile";

type Rgb = readonly [red: number, green: number, blue: number];

const WCAG_TEXT_CONTRAST = 4.5;
const WCAG_NON_TEXT_CONTRAST = 3;

const cssVariableTheme = createTheme({
  cssVariables: { colorSchemeSelector: "class" },
  colorSchemes: { light: true, dark: true },
  transitions: { duration: { short: 0 } },
});

function renderInTheme(ui: ReactNode) {
  return render(
    <MUIThemeProvider theme={cssVariableTheme}>{ui}</MUIThemeProvider>,
  );
}

function paint(...cssColors: string[]): Rgb {
  const context = new OffscreenCanvas(1, 1).getContext("2d");
  assertDefined(context);

  for (const cssColor of cssColors) {
    context.fillStyle = cssColor;
    context.fillRect(0, 0, 1, 1);
  }

  const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
  expect(alpha, `painting ${cssColors.join(", ")} must end opaque`).toBe(255);

  return [red, green, blue];
}

function relativeLuminance(rgb: Rgb): number {
  const [red, green, blue] = rgb.map((channel) => {
    const value = channel / 255;

    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(first: Rgb, second: Rgb): number {
  const [lighter, darker] = [
    relativeLuminance(first),
    relativeLuminance(second),
  ]
    .sort((a, b) => b - a)
    .map((luminance) => luminance + 0.05);

  return lighter / darker;
}

function channelDistance(first: Rgb, second: Rgb): number {
  return Math.max(
    ...first.map((channel, index) => Math.abs(channel - second[index])),
  );
}

function styleOf(tile: Locator, pseudoElement?: string): CSSStyleDeclaration {
  return getComputedStyle(tile.element(), pseudoElement);
}

function backgroundLuminance(tile: Locator): number {
  return relativeLuminance(paint(styleOf(tile).backgroundColor));
}

describe("Tile", () => {
  test("is named by its symbol label and keeps the symbol image decorative", async () => {
    const screen = await renderInTheme(
      <Tile onActivate={vi.fn()}>
        <AACSymbol label="Cat" imageSrc={TEST_IMAGE_SRC} />
      </Tile>,
    );

    const tile = screen.getByRole("button", { name: "Cat" });
    await expect.element(tile).toBeVisible();
    expect(tile.element().querySelector("img")?.getAttribute("alt")).toBe("");
  });

  test("uses ariaLabel to name custom content", async () => {
    const screen = await renderInTheme(
      <Tile ariaLabel="Speak Hello" onActivate={vi.fn()}>
        <span aria-hidden="true">Hello</span>
      </Tile>,
    );

    await expect
      .element(screen.getByRole("button", { name: "Speak Hello" }))
      .toBeVisible();
  });

  test("describes folder tiles as opening a board and gives word tiles no description", async () => {
    const screen = await renderInTheme(
      <>
        <Tile variant="folder" onActivate={vi.fn()}>
          Animals
        </Tile>
        <Tile onActivate={vi.fn()}>Cat</Tile>
      </>,
    );

    await expect
      .element(screen.getByRole("button", { name: "Animals" }))
      .toHaveAccessibleDescription("Opens board");
    await expect
      .element(screen.getByRole("button", { name: "Cat" }))
      .not.toHaveAccessibleDescription();
  });

  test.each(["#000000", "#ffffff", "#808080", "#ff0000", "#ffeb3b", "#3f51b5"])(
    "keeps the label readable on a %s background",
    async (backgroundColor) => {
      const screen = await renderInTheme(
        <Tile backgroundColor={backgroundColor} onActivate={vi.fn()}>
          Word
        </Tile>,
      );
      const { color, backgroundColor: background } = styleOf(
        screen.getByRole("button", { name: "Word" }),
      );

      expect(contrastRatio(paint(color), paint(background))).toBeGreaterThan(
        WCAG_TEXT_CONTRAST,
      );
    },
  );

  test.each([true, false])(
    "shapes folder tiles as a tabbed folder with a readable front panel (borders visible: %s)",
    async (isBorderVisible) => {
      const screen = await renderInTheme(
        <>
          <Tile
            backgroundColor="#3f51b5"
            borderColor="#00ff00"
            isBorderVisible={isBorderVisible}
            variant="folder"
            onActivate={vi.fn()}
          >
            Folder
          </Tile>
          <Tile backgroundColor="#3f51b5" onActivate={vi.fn()}>
            Word
          </Tile>
        </>,
      );
      const folder = screen.getByRole("button", { name: "Folder" });
      const back = styleOf(folder, "::before");
      const front = styleOf(folder, "::after");
      const frontFill = paint(front.backgroundColor);

      expect(back.clipPath).toMatch(/^shape\(/);
      expect(
        contrastRatio(paint(styleOf(folder).color), frontFill),
      ).toBeGreaterThan(WCAG_TEXT_CONTRAST);
      expect(
        channelDistance(
          paint(front.backgroundColor, front.borderTopColor),
          isBorderVisible ? paint("#00ff00") : frontFill,
        ),
      ).toBeLessThanOrEqual(1);
      expect(
        styleOf(screen.getByRole("button", { name: "Word" }), "::before")
          .content,
      ).toBe("none");
    },
  );

  test.each([
    undefined,
    "#ffffff",
    "#c8f7a8",
    "#ffeb3b",
    "#808080",
    "#ff0000",
    "#3f51b5",
    "#000000",
  ])(
    "sets the folder tab apart from the front panel on a %s background",
    async (backgroundColor) => {
      const screen = await renderInTheme(
        <Tile
          backgroundColor={backgroundColor}
          variant="folder"
          onActivate={vi.fn()}
        >
          Folder
        </Tile>,
      );
      const folder = screen.getByRole("button", { name: "Folder" });

      expect(
        contrastRatio(
          paint(styleOf(folder, "::before").backgroundColor),
          paint(styleOf(folder, "::after").backgroundColor),
        ),
      ).toBeGreaterThanOrEqual(WCAG_NON_TEXT_CONTRAST);
    },
  );

  test("darkens the background on hover, and darkens it further in dark mode", async () => {
    const screen = await renderInTheme(
      <>
        <div className="light">
          <Tile backgroundColor="#ff0000" onActivate={vi.fn()}>
            Light
          </Tile>
        </div>
        <div className="dark">
          <Tile backgroundColor="#ff0000" onActivate={vi.fn()}>
            Dark
          </Tile>
        </div>
      </>,
    );
    const lightTile = screen.getByRole("button", { name: "Light" });
    const darkTile = screen.getByRole("button", { name: "Dark" });

    await darkTile.hover();
    const restingLuminance = backgroundLuminance(lightTile);
    await lightTile.hover();
    const lightHoverLuminance = backgroundLuminance(lightTile);
    await darkTile.hover();
    const darkHoverLuminance = backgroundLuminance(darkTile);
    await darkTile.unhover();

    expect(lightHoverLuminance).toBeLessThan(restingLuminance);
    expect(darkHoverLuminance).toBeLessThan(lightHoverLuminance);
  });

  test.each([
    { description: "its own border color", borderColor: "#00ff00" },
    { description: "the background color", borderColor: undefined },
  ])("draws the border in $description", async ({ borderColor }) => {
    const screen = await renderInTheme(
      <Tile
        backgroundColor="#ff0000"
        borderColor={borderColor}
        onActivate={vi.fn()}
      >
        Bordered
      </Tile>,
    );
    const styles = styleOf(screen.getByRole("button", { name: "Bordered" }));

    expect(
      channelDistance(
        paint(styles.borderTopColor),
        paint(borderColor ?? "#ff0000"),
      ),
    ).toBeLessThanOrEqual(1);
  });

  test("hides the border without shifting the tile's content", async () => {
    const screen = await renderInTheme(
      <>
        <Tile
          backgroundColor="#ff0000"
          borderColor="#00ff00"
          onActivate={vi.fn()}
        >
          <span>Bordered</span>
        </Tile>
        <Tile
          backgroundColor="#ff0000"
          borderColor="#00ff00"
          isBorderVisible={false}
          onActivate={vi.fn()}
        >
          <span>Borderless</span>
        </Tile>
      </>,
    );
    const contentOffset = (name: string) => {
      const tile = screen.getByRole("button", { name }).element();
      const content = screen.getByText(name, { exact: true }).element();
      const tileBounds = tile.getBoundingClientRect();
      const contentBounds = content.getBoundingClientRect();

      return {
        top: contentBounds.top - tileBounds.top,
        left: contentBounds.left - tileBounds.left,
      };
    };
    const borderless = styleOf(
      screen.getByRole("button", { name: "Borderless" }),
    );

    expect(
      channelDistance(
        paint(borderless.backgroundColor, borderless.borderTopColor),
        paint(borderless.backgroundColor),
      ),
    ).toBe(0);
    expect(contentOffset("Borderless")).toEqual(contentOffset("Bordered"));
  });

  test("renders the background as gray at zero tile saturation", async () => {
    const screen = await renderInTheme(
      <div style={{ "--tile-saturation": 0 } as CSSProperties}>
        <Tile backgroundColor="#ff0000" onActivate={vi.fn()}>
          Muted
        </Tile>
      </div>,
    );
    const channels = paint(
      styleOf(screen.getByRole("button", { name: "Muted" })).backgroundColor,
    );

    expect(Math.max(...channels) - Math.min(...channels)).toBeLessThanOrEqual(
      1,
    );
  });

  test("calls onActivate when clicked", async () => {
    const onActivate = vi.fn();
    const screen = await renderInTheme(
      <Tile onActivate={onActivate}>
        <span>Click me</span>
      </Tile>,
    );

    await screen.getByRole("button", { name: "Click me" }).click();

    expect(onActivate).toHaveBeenCalledOnce();
  });

  test("does not call onActivate when disabled", async () => {
    const onActivate = vi.fn();
    const screen = await renderInTheme(
      <Tile disabled onActivate={onActivate}>
        Disabled tile
      </Tile>,
    );
    const tile = screen.getByRole("button", { name: "Disabled tile" });

    await expect.element(tile).toBeDisabled();
    await tile.click({ force: true });

    expect(onActivate).not.toHaveBeenCalled();
  });
});
