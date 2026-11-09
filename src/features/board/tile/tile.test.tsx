import {
  createTheme,
  ThemeProvider as MUIThemeProvider,
} from "@mui/material/styles";
import { assertDefined } from "@shared/testing/assert-defined";
import type { ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";
import type { Locator } from "vitest/browser";
import { render, type RenderResult } from "vitest-browser-react";
import type { BoardButton } from "../board-types";
import { TEST_IMAGE_SRC } from "../testing";
import { Tile } from "./tile";
import {
  setTileBordersVisible,
  setTileSaturation,
} from "./tile-preferences-store";

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

function makeButton(overrides: Partial<BoardButton>): BoardButton {
  return { id: "button", label: "Word", actions: [], ...overrides };
}

function tileElement(overrides: Partial<BoardButton>) {
  return (
    <Tile button={makeButton(overrides)} tabIndex={0} onActivate={vi.fn()} />
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
  assertDefined(red);
  assertDefined(green);
  assertDefined(blue);
  expect(alpha, `painting ${cssColors.join(", ")} must end opaque`).toBe(255);

  return [red, green, blue];
}

function linearizeChannel(channel: number): number {
  const value = channel / 255;

  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance([red, green, blue]: Rgb): number {
  return (
    0.2126 * linearizeChannel(red) +
    0.7152 * linearizeChannel(green) +
    0.0722 * linearizeChannel(blue)
  );
}

function contrastRatio(first: Rgb, second: Rgb): number {
  const firstLuminance = relativeLuminance(first) + 0.05;
  const secondLuminance = relativeLuminance(second) + 0.05;

  return (
    Math.max(firstLuminance, secondLuminance) /
    Math.min(firstLuminance, secondLuminance)
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

  test("is named by its vocalization when it has no label", async () => {
    const screen = await renderInTheme(
      tileElement({
        label: "",
        vocalization: "Speak Hello",
        imageSrc: TEST_IMAGE_SRC,
      }),
    );

    await expect
      .element(screen.getByRole("button", { name: "Speak Hello" }))
      .toBeVisible();
  });

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

  test.each([true, false])(
    "marks folder tiles with a corner that stands out from the tile (borders visible: %s)",
    async (areBordersVisible) => {
      setTileBordersVisible(areBordersVisible);
      const screen = await renderInTheme(
        <>
          {tileElement({
            label: "Folder",
            backgroundColor: "#3f51b5",
            linkedBoardId: "folder",
          })}
          {tileElement({ label: "Word", backgroundColor: "#3f51b5" })}
        </>,
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

  test("activates with its button when clicked", async () => {
    const onActivate = vi.fn();
    const button = makeButton({ label: "Click me" });
    const screen = await renderInTheme(
      <Tile button={button} tabIndex={0} onActivate={onActivate} />,
    );

    await screen.getByRole("button", { name: "Click me" }).click();

    expect(onActivate).toHaveBeenCalledExactlyOnceWith(button);
  });
});
