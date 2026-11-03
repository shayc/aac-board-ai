import {
  createTheme,
  ThemeProvider as MUIThemeProvider,
} from "@mui/material/styles";
import type { CSSProperties } from "react";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { AACSymbol } from "../aac-symbol/aac-symbol";
import { TEST_IMAGE_SRC } from "../testing";
import { Tile } from "./tile";

// Colors are rendered through oklch(from ...), so the browser serializes computed
// values as oklch(...)/color(...) rather than rgb(...). Ask the browser for the
// canonical serialization of the expected color instead of hardcoding a format.
function resolveColor(cssColor: string): string {
  const probe = document.createElement("div");
  document.body.append(probe);
  probe.style.color = cssColor;
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved;
}

function resolveBackgroundColor(cssColor: string): string {
  const probe = document.createElement("div");
  document.body.append(probe);
  probe.style.backgroundColor = cssColor;
  const resolved = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return resolved;
}

function resolveColorInSrgb(cssColor: string): string {
  return resolveColor(`color(srgb from ${cssColor} r g b)`);
}

describe("Tile", () => {
  test("renders an AACSymbol child with its accessible label and decorative image", async () => {
    const screen = await render(
      <Tile onActivate={vi.fn()}>
        <AACSymbol label="Cat" imageSrc={TEST_IMAGE_SRC} />
      </Tile>,
    );

    await expect
      .element(screen.getByRole("button", { name: "Cat" }))
      .toBeVisible();

    // Image is decorative (alt=""), use querySelector
    const img = screen.container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe(TEST_IMAGE_SRC);
    expect(img?.getAttribute("alt")).toBe("");
  });

  test("uses ariaLabel to name custom content", async () => {
    const screen = await render(
      <Tile ariaLabel="Speak Hello" onActivate={vi.fn()}>
        <span aria-hidden="true">Hello</span>
      </Tile>,
    );

    await expect
      .element(screen.getByRole("button", { name: "Speak Hello" }))
      .toBeVisible();
    await expect.element(screen.getByText("Hello")).toBeVisible();
  });

  test("describes folder tiles as opening a board", async () => {
    const screen = await render(
      <Tile variant="folder" onActivate={vi.fn()}>
        Animals
      </Tile>,
    );

    await expect
      .element(screen.getByRole("button", { name: "Animals" }))
      .toHaveAccessibleDescription("Opens board");
  });

  test("gives word tiles no description", async () => {
    const screen = await render(<Tile onActivate={vi.fn()}>Cat</Tile>);

    await expect
      .element(screen.getByRole("button", { name: "Cat" }))
      .not.toHaveAccessibleDescription();
  });

  test("renders the folder corner in the contrast color of the board's tile color", async () => {
    const screen = await render(
      <Tile
        backgroundColor="#000000"
        borderColor="#000000"
        variant="folder"
        onActivate={vi.fn()}
      >
        Folder
      </Tile>,
    );

    const button = screen.getByRole("button", { name: "Folder" });
    const styles = getComputedStyle(button.element());
    const afterStyles = getComputedStyle(button.element(), "::after");

    expect(afterStyles.display).toBe("block");
    expect(styles.color).toBe("rgb(255, 255, 255)");
    expect(afterStyles.borderInlineEndColor).toBe(
      resolveColor("color-mix(in srgb, white 75%, transparent)"),
    );
  });

  test("applies backgroundColor and a readable text color", async () => {
    const screen = await render(
      <Tile backgroundColor="#000000" onActivate={vi.fn()}>
        Colored
      </Tile>,
    );

    const button = screen.getByRole("button", { name: "Colored" });
    const styles = getComputedStyle(button.element());

    expect(resolveColorInSrgb(styles.backgroundColor)).toBe(
      resolveColorInSrgb("oklch(from #000000 l c h)"),
    );
    expect(styles.color).toBe("rgb(255, 255, 255)");
  });

  test("animates only its shadow so color changes apply instantly", async () => {
    const screen = await render(
      <Tile backgroundColor="#ff0000" onActivate={vi.fn()}>
        Instant
      </Tile>,
    );

    const button = screen.getByRole("button", { name: "Instant" });

    expect(getComputedStyle(button.element()).transitionProperty).toBe(
      "box-shadow",
    );
  });

  test("darkens only the background on hover", async () => {
    const theme = createTheme({ transitions: { duration: { short: 0 } } });
    const screen = await render(
      <MUIThemeProvider theme={theme}>
        <Tile backgroundColor="#ff0000" onActivate={vi.fn()}>
          Colored
        </Tile>
      </MUIThemeProvider>,
    );

    const button = screen.getByRole("button", { name: "Colored" });
    await button.hover();

    const styles = getComputedStyle(button.element());
    expect(styles.backgroundColor).toBe(
      resolveBackgroundColor(
        "color-mix(in srgb, oklch(from #ff0000 l c h) 92%, black)",
      ),
    );
    expect(styles.filter).toBe("none");

    await button.unhover();
  });

  test("darkens more on hover in dark mode", async () => {
    const theme = createTheme({
      palette: { mode: "dark" },
      transitions: { duration: { short: 0 } },
    });
    const screen = await render(
      <MUIThemeProvider theme={theme}>
        <Tile backgroundColor="#ff0000" onActivate={vi.fn()}>
          Colored
        </Tile>
      </MUIThemeProvider>,
    );

    const button = screen.getByRole("button", { name: "Colored" });
    await button.hover();

    expect(getComputedStyle(button.element()).backgroundColor).toBe(
      resolveBackgroundColor(
        "color-mix(in srgb, oklch(from #ff0000 l c h) 84%, black)",
      ),
    );

    await button.unhover();
  });

  test("applies borderColor when provided", async () => {
    const screen = await render(
      <Tile borderColor="#00ff00" onActivate={vi.fn()}>
        Bordered
      </Tile>,
    );

    const button = screen.getByRole("button", { name: "Bordered" });
    const styles = getComputedStyle(button.element());

    expect(styles.borderColor).toBe(resolveColor("oklch(from #00ff00 l c h)"));
  });

  test("defaults borderColor to backgroundColor when borderColor is omitted", async () => {
    const screen = await render(
      <Tile backgroundColor="#ff0000" onActivate={vi.fn()}>
        Match
      </Tile>,
    );

    const button = screen.getByRole("button", { name: "Match" });
    const styles = getComputedStyle(button.element());

    expect(styles.borderColor).toBe(resolveColor("oklch(from #ff0000 l c h)"));
  });

  test("desaturates the background when --tile-saturation is set", async () => {
    const screen = await render(
      <div style={{ "--tile-saturation": 0 } as CSSProperties}>
        <Tile backgroundColor="#ff0000" onActivate={vi.fn()}>
          Muted
        </Tile>
      </div>,
    );

    const button = screen.getByRole("button", { name: "Muted" });
    const styles = getComputedStyle(button.element());

    // chroma × 0 → achromatic gray at the original lightness
    expect(styles.backgroundColor).toBe(
      resolveColor("oklch(from #ff0000 l 0 h)"),
    );
  });

  test("dims the background when --tile-brightness is set", async () => {
    const screen = await render(
      <div style={{ "--tile-brightness": 0.5 } as CSSProperties}>
        <Tile backgroundColor="#ffff00" onActivate={vi.fn()}>
          Dim
        </Tile>
      </div>,
    );

    const button = screen.getByRole("button", { name: "Dim" });
    const styles = getComputedStyle(button.element());

    expect(styles.backgroundColor).toBe(
      resolveColor("oklch(from #ffff00 calc(l * 0.5) calc(c * 0.5) h)"),
    );
  });

  test("hides the border without changing its width", async () => {
    const screen = await render(
      <Tile
        backgroundColor="#ff0000"
        borderColor="#00ff00"
        isBorderVisible={false}
        onActivate={vi.fn()}
      >
        Borderless
      </Tile>,
    );

    const button = screen.getByRole("button", { name: "Borderless" });
    const styles = getComputedStyle(button.element());

    expect(styles.borderColor).toBe("rgba(0, 0, 0, 0)");
    expect(styles.borderTopWidth).toBe("4px");
    expect(styles.backgroundColor).toBe(
      resolveColor("oklch(from #ff0000 l c h)"),
    );
  });

  test("keeps the folder corner visible when the border is hidden", async () => {
    const screen = await render(
      <Tile
        backgroundColor="#000000"
        borderColor="#000000"
        variant="folder"
        isBorderVisible={false}
        onActivate={vi.fn()}
      >
        Folder
      </Tile>,
    );

    const button = screen.getByRole("button", { name: "Folder" });
    const afterStyles = getComputedStyle(button.element(), "::after");

    expect(afterStyles.display).toBe("block");
    expect(afterStyles.borderInlineEndColor).toBe(
      resolveColor("color-mix(in srgb, white 75%, transparent)"),
    );
  });

  test("keeps the folder corner color when dimming flips the label color", async () => {
    const screen = await render(
      <div style={{ "--tile-brightness": 0.7 } as CSSProperties}>
        <Tile backgroundColor="#9a9a9a" variant="folder" onActivate={vi.fn()}>
          Dimmed folder
        </Tile>
      </div>,
    );

    const button = screen.getByRole("button", { name: "Dimmed folder" });
    const afterStyles = getComputedStyle(button.element(), "::after");

    expect(getComputedStyle(button.element()).color).toBe("rgb(255, 255, 255)");
    expect(afterStyles.borderInlineEndColor).toBe(
      resolveColor("color-mix(in srgb, black 75%, transparent)"),
    );
  });

  test("calls onActivate when clicked", async () => {
    const onActivate = vi.fn();

    const screen = await render(
      <Tile onActivate={onActivate}>
        <span>Click me</span>
      </Tile>,
    );

    const button = screen.getByRole("button", { name: "Click me" });
    await button.click();

    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  test("does not call onActivate when disabled", async () => {
    const onActivate = vi.fn();

    const screen = await render(
      <Tile disabled onActivate={onActivate}>
        Disabled tile
      </Tile>,
    );

    const button = screen.getByRole("button", { name: "Disabled tile" });
    await expect.element(button).toBeDisabled();
    expect(getComputedStyle(button.element()).boxShadow).toBe("none");
    await button.click({ force: true });

    expect(onActivate).not.toHaveBeenCalled();
  });
});
