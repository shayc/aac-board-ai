import type { BoardAction, BoardButton } from "@features/library";
import {
  createTheme,
  ThemeProvider as MUIThemeProvider,
} from "@mui/material/styles";
import { assertDefined } from "@shared/testing/assert-defined";
import {
  contrastRatio,
  paint,
  relativeLuminance,
  type Rgb,
  WCAG_NON_TEXT_CONTRAST,
  WCAG_TEXT_CONTRAST,
} from "@shared/testing/contrast";
import { TEST_IMAGE_SRC } from "@shared/testing/test-image";
import { ThemeProvider } from "@shared/theme/theme-provider";
import type { ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";
import { render, type RenderResult } from "vitest-browser-react";
import type { Locator } from "vitest/browser";
import { Tile } from "./tile";
import {
  setTileBordersVisible,
  setTileBrightness,
  setTileSaturation,
  TILE_BRIGHTNESS,
} from "./tile-preferences-store";

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

function makeButton(overrides: Partial<BoardButton>): BoardButton {
  return { id: "button", label: "Word", actions: [], ...overrides };
}

function tileElement(overrides: Partial<BoardButton>) {
  return (
    <Tile
      button={makeButton(overrides)}
      language="en"
      tabIndex={0}
      onActivate={vi.fn()}
    />
  );
}

function channelDistance(
  [red, green, blue]: Rgb,
  [otherRed, otherGreen, otherBlue]: Rgb,
): number {
  return Math.max(
    Math.abs(red - otherRed),
    Math.abs(green - otherGreen),
    Math.abs(blue - otherBlue),
  );
}

function styleOf(tile: Locator, pseudoElement?: string): CSSStyleDeclaration {
  return getComputedStyle(tile.element(), pseudoElement);
}

function backgroundLuminance(tile: Locator): number {
  return relativeLuminance(paint(styleOf(tile).backgroundColor));
}

function Unhoverable({ children }: { children: ReactNode }) {
  return <div style={{ pointerEvents: "none" }}>{children}</div>;
}

async function paintTileAtBrightness(
  brightness: number,
  overrides: Partial<BoardButton>,
): Promise<Rgb> {
  setTileBrightness(brightness);
  // A pointer left by another test can tint the measured colors.
  const screen = await renderInTheme(
    <Unhoverable>{tileElement(overrides)}</Unhoverable>,
  );
  const styles = styleOf(screen.getByRole("button", { name: "Word" }));
  const painted = paint(styles.backgroundColor, styles.borderTopColor);
  await screen.unmount();

  return painted;
}

function scale([red, green, blue]: Rgb, factor: number): Rgb {
  return [red * factor, green * factor, blue * factor];
}

async function measureLuminanceOnHover(backgroundColor?: string) {
  const screen = await renderInTheme(
    <>
      <Unhoverable>
        {tileElement({ label: "Resting", backgroundColor })}
      </Unhoverable>
      {tileElement({ label: "Hovered", backgroundColor })}
    </>,
  );
  const restingTile = screen.getByRole("button", { name: "Resting" });
  const hoveredTile = screen.getByRole("button", { name: "Hovered" });

  await hoveredTile.hover();

  return {
    resting: backgroundLuminance(restingTile),
    hovered: backgroundLuminance(hoveredTile),
  };
}

describe("Tile", () => {
  test("is named by its symbol label and keeps the symbol image decorative", async () => {
    const screen = await renderInTheme(
      tileElement({ label: "Cat", imageSrc: TEST_IMAGE_SRC }),
    );

    const tile = screen.getByRole("button", { name: "Cat" });
    await expect.element(tile).toBeVisible();
    expect(tile.element().querySelector("img")?.getAttribute("alt")).toBe("");
  });

  test.each<{ action: BoardAction; name: string }>([
    { action: { kind: "space" }, name: "Space" },
    { action: { kind: "backspace" }, name: "Backspace" },
    { action: { kind: "clear" }, name: "Clear message" },
    { action: { kind: "home" }, name: "Go home" },
    { action: { kind: "play" }, name: "Speak message" },
  ])("names an unlabeled $action.kind tile $name", async ({ action, name }) => {
    const screen = await renderInTheme(
      tileElement({ label: "", actions: [action] }),
    );

    await expect.element(screen.getByRole("button")).toHaveAccessibleName(name);
  });

  test.each<{ label: string; vocalization: string; name: string }>([
    { label: "Speak now", vocalization: "Read aloud", name: "Speak now" },
    { label: "", vocalization: "Read aloud", name: "Read aloud" },
  ])(
    "keeps the authored name $name on a command tile",
    async ({ label, vocalization, name }) => {
      const screen = await renderInTheme(
        tileElement({ label, vocalization, actions: [{ kind: "play" }] }),
      );

      await expect
        .element(screen.getByRole("button"))
        .toHaveAccessibleName(name);
    },
  );

  test.each<{ description: string; overrides: Partial<BoardButton> }>([
    {
      description: "only spelling",
      overrides: { actions: [{ kind: "spell", text: "A" }] },
    },
    {
      description: "only an unsupported action",
      overrides: { actions: [{ kind: "unsupported", raw: ":shift" }] },
    },
    {
      description: "two commands",
      overrides: { actions: [{ kind: "play" }, { kind: "clear" }] },
    },
    {
      description: "spelling and a command",
      overrides: { actions: [{ kind: "spell", text: "A" }, { kind: "play" }] },
    },
    {
      description: "a board link and a command",
      overrides: { linkedBoardId: "animals", actions: [{ kind: "home" }] },
    },
  ])(
    "keeps a tile with $description unnamed when it has no authored name",
    async ({ overrides }) => {
      const screen = await renderInTheme(
        tileElement({ label: "", ...overrides }),
      );

      await expect.element(screen.getByRole("button")).toHaveAccessibleName("");
    },
  );

  test("describes folder tiles as opening a board and gives word tiles no description", async () => {
    const screen = await renderInTheme(
      <>
        {tileElement({ label: "Animals", linkedBoardId: "animals" })}
        {tileElement({ label: "Cat" })}
      </>,
    );

    await expect
      .element(screen.getByRole("button", { name: "Animals" }))
      .toHaveAccessibleDescription("Opens board");
    await expect
      .element(screen.getByRole("button", { name: "Cat" }))
      .not.toHaveAccessibleDescription();
  });

  test.each([
    "#000000",
    "#ffffff",
    "#808080",
    "#ff0000",
    "#ffeb3b",
    "#3f51b5",
    "rgba(0, 0, 0, 0.1)",
  ])("keeps the label readable on a %s background", async (backgroundColor) => {
    const screen = await renderInTheme(
      <Unhoverable>{tileElement({ backgroundColor })}</Unhoverable>,
    );
    const { color, backgroundColor: background } = styleOf(
      screen.getByRole("button", { name: "Word" }),
    );

    expect(contrastRatio(paint(color), paint(background))).toBeGreaterThan(
      WCAG_TEXT_CONTRAST,
    );
  });

  // A saturated mid-tone is the hardest case for a fold mixed toward black;
  // a dark tile's fold mixes toward white instead.
  test.each([
    {
      description: "mid-tone",
      backgroundColor: "#3f51b5",
      areBordersVisible: true,
    },
    {
      description: "mid-tone",
      backgroundColor: "#3f51b5",
      areBordersVisible: false,
    },
    {
      description: "dark",
      backgroundColor: "#1e2127",
      areBordersVisible: true,
    },
    {
      description: "dark",
      backgroundColor: "#1e2127",
      areBordersVisible: false,
    },
  ])(
    "marks folder tiles with a corner that stands out from a $description tile (borders visible: $areBordersVisible)",
    async ({ backgroundColor, areBordersVisible }) => {
      setTileBordersVisible(areBordersVisible);
      const screen = await renderInTheme(
        <Unhoverable>
          {tileElement({
            label: "Folder",
            backgroundColor,
            linkedBoardId: "folder",
          })}
          {tileElement({ label: "Word", backgroundColor })}
        </Unhoverable>,
      );
      const folder = screen.getByRole("button", { name: "Folder" });
      const corner = styleOf(folder, "::after");
      const background = styleOf(folder).backgroundColor;

      expect(corner.content).not.toBe("none");
      expect(
        contrastRatio(
          paint(background, corner.borderInlineEndColor),
          paint(background),
        ),
      ).toBeGreaterThan(WCAG_NON_TEXT_CONTRAST);
      expect(
        styleOf(screen.getByRole("button", { name: "Word" }), "::after")
          .content,
      ).toBe("none");
    },
  );

  test("lightens a dark tile's background on hover", async () => {
    const { resting, hovered } = await measureLuminanceOnHover("#000000");

    expect(hovered).toBeGreaterThan(resting);
  });

  test.each([
    { description: "light", backgroundColor: "#ffffff" },
    { description: "uncolored", backgroundColor: undefined },
  ])(
    "darkens a $description tile's background on hover",
    async ({ backgroundColor }) => {
      const { resting, hovered } =
        await measureLuminanceOnHover(backgroundColor);

      expect(hovered).toBeLessThan(resting);
    },
  );

  test.each([
    {
      description: "in its own color",
      backgroundColor: "#ff0000",
      borderColor: "#00ff00",
    },
    {
      description: "see-through over the tile's color",
      backgroundColor: "rgba(0, 0, 0, 0.1)",
      borderColor: "rgba(255, 0, 0, 0.2)",
    },
  ])(
    "draws the border $description",
    async ({ backgroundColor, borderColor }) => {
      setTileBordersVisible(true);
      const screen = await renderInTheme(
        <Unhoverable>
          {tileElement({ label: "Bordered", backgroundColor, borderColor })}
        </Unhoverable>,
      );
      const styles = styleOf(screen.getByRole("button", { name: "Bordered" }));

      expect(
        channelDistance(
          paint(styles.backgroundColor, styles.borderTopColor),
          paint("#ffffff", backgroundColor, borderColor),
        ),
      ).toBeLessThanOrEqual(1);
    },
  );

  test("keeps the border the background's color on hover when the tile has no border color", async () => {
    setTileBordersVisible(true);
    const screen = await renderInTheme(
      tileElement({ label: "Bordered", backgroundColor: "#bbedc4" }),
    );
    const tile = screen.getByRole("button", { name: "Bordered" });

    await tile.hover();
    const styles = styleOf(tile);

    expect(
      channelDistance(
        paint(styles.backgroundColor, styles.borderTopColor),
        paint(styles.backgroundColor),
      ),
    ).toBeLessThanOrEqual(1);
  });

  test("hides the border without shifting the tile's content", async () => {
    const bordered = { backgroundColor: "#ff0000", borderColor: "#00ff00" };
    const contentOffset = (screen: RenderResult, name: string) => {
      const tile = screen.getByRole("button", { name }).element();
      const content = screen.getByText(name, { exact: true }).element();
      const tileBounds = tile.getBoundingClientRect();
      const contentBounds = content.getBoundingClientRect();

      return {
        top: contentBounds.top - tileBounds.top,
        left: contentBounds.left - tileBounds.left,
      };
    };

    setTileBordersVisible(true);
    const withBorders = await renderInTheme(
      tileElement({ label: "Bordered", ...bordered }),
    );
    const borderedOffset = contentOffset(withBorders, "Bordered");
    await withBorders.unmount();

    setTileBordersVisible(false);
    const withoutBorders = await renderInTheme(
      tileElement({ label: "Bordered", ...bordered }),
    );
    const borderless = styleOf(
      withoutBorders.getByRole("button", { name: "Bordered" }),
    );

    expect(
      channelDistance(
        paint(borderless.backgroundColor, borderless.borderTopColor),
        paint(borderless.backgroundColor),
      ),
    ).toBe(0);
    expect(contentOffset(withoutBorders, "Bordered")).toEqual(borderedOffset);
  });

  test("renders the background as gray at zero tile saturation", async () => {
    setTileSaturation(0);
    const screen = await renderInTheme(
      tileElement({ label: "Muted", backgroundColor: "#ff0000" }),
    );
    const channels = paint(
      styleOf(screen.getByRole("button", { name: "Muted" })).backgroundColor,
    );

    expect(Math.max(...channels) - Math.min(...channels)).toBeLessThanOrEqual(
      1,
    );
  });

  test.each([
    { description: "its own background color", backgroundColor: "#ffcc00" },
    { description: "the theme's background", backgroundColor: undefined },
    {
      description: "a translucent border",
      backgroundColor: "#ffffff",
      borderColor: "rgb(0 128 255 / 0.5)",
    },
  ])(
    "scales each color channel by the tile brightness with $description",
    async (colors) => {
      setTileBordersVisible(true);

      const bright = await paintTileAtBrightness(1, colors);
      const dimmed = await paintTileAtBrightness(TILE_BRIGHTNESS.min, colors);

      expect(
        channelDistance(dimmed, scale(bright, TILE_BRIGHTNESS.min)),
      ).toBeLessThanOrEqual(1);
    },
  );

  test.each(["#ffffff", "#ffeb3b", "#3f51b5"])(
    "keeps the label readable on a %s background at the lowest brightness",
    async (backgroundColor) => {
      setTileBrightness(TILE_BRIGHTNESS.min);

      const screen = await renderInTheme(
        <Unhoverable>{tileElement({ backgroundColor })}</Unhoverable>,
      );
      const { color, backgroundColor: background } = styleOf(
        screen.getByRole("button", { name: "Word" }),
      );

      expect(
        contrastRatio(paint(color), paint(background)),
      ).toBeGreaterThanOrEqual(WCAG_TEXT_CONTRAST);
    },
  );

  test("eases its symbol with the same timing as its own colors", async () => {
    const screen = await render(
      <ThemeProvider>
        {tileElement({ imageSrc: TEST_IMAGE_SRC })}
      </ThemeProvider>,
    );
    const tile = screen.getByRole("button", { name: "Word" });
    const symbol = tile.element().querySelector("img");
    assertDefined(symbol);
    const tileStyles = styleOf(tile);
    const symbolStyles = getComputedStyle(symbol);

    expect(symbolStyles.transitionProperty).toContain("filter");
    expect(symbolStyles.transitionDuration).not.toBe("0s");
    expect(symbolStyles.transitionDuration).toBe(tileStyles.transitionDuration);
    expect(symbolStyles.transitionTimingFunction).toBe(
      tileStyles.transitionTimingFunction,
    );
  });

  test("hands its button to the activation handler when clicked", async () => {
    const onActivate = vi.fn();
    const button = makeButton({ label: "Click me" });
    const screen = await renderInTheme(
      <Tile
        button={button}
        language="en"
        tabIndex={0}
        onActivate={onActivate}
      />,
    );

    await screen.getByRole("button", { name: "Click me" }).click();

    expect(onActivate).toHaveBeenCalledExactlyOnceWith(button);
  });

  test.each([
    { size: "a small tile", width: 96, height: 96, fontSize: "14px" },
    { size: "a wide, short tile", width: 460, height: 120, fontSize: "14px" },
    { size: "a mid-sized tile", width: 224, height: 174, fontSize: "18px" },
    { size: "a large tile", width: 460, height: 260, fontSize: "20px" },
  ])(
    "sizes its label to the shorter side of $size",
    async ({ width, height, fontSize }) => {
      const screen = await render(
        <ThemeProvider>
          <div style={{ width, height }}>
            {tileElement({ label: "Sized", imageSrc: TEST_IMAGE_SRC })}
          </div>
        </ThemeProvider>,
      );

      await expect.element(screen.getByText("Sized")).toHaveStyle({ fontSize });
    },
  );
});
