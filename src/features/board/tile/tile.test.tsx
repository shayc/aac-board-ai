import Button from "@mui/material/Button";
import {
  createTheme,
  ThemeProvider as MUIThemeProvider,
} from "@mui/material/styles";
import { createRef, type CSSProperties } from "react";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
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

function resolveBoxShadow(cssShadow: string): string {
  const probe = document.createElement("div");
  document.body.append(probe);
  probe.style.boxShadow = cssShadow;
  const resolved = getComputedStyle(probe).boxShadow;
  probe.remove();
  return resolved;
}

function getStateShadows(element: Element) {
  const styleClass = [...element.classList].find((className) =>
    className.includes("MuiButtonBase-root-MuiButton-root"),
  );
  if (!styleClass) {
    throw new Error("Expected an Emotion-generated Button class");
  }

  const shadows = {
    rest: [] as string[],
    hover: [] as string[],
    active: [] as string[],
    focusVisible: [] as string[],
    disabled: [] as string[],
  };

  function collect(rules: CSSRuleList) {
    for (const rule of rules) {
      if (rule instanceof CSSMediaRule) {
        collect(rule.cssRules);
        continue;
      }
      if (!(rule instanceof CSSStyleRule)) {
        continue;
      }
      if (!rule.selectorText.includes(`.${styleClass}`)) {
        continue;
      }

      const boxShadow = rule.style.boxShadow;
      if (!boxShadow) {
        continue;
      }

      const resolvedShadow = resolveBoxShadow(boxShadow);
      if (rule.selectorText.includes(":hover")) {
        shadows.hover.push(resolvedShadow);
      } else if (rule.selectorText.includes(":active")) {
        shadows.active.push(resolvedShadow);
      } else if (rule.selectorText.includes(".Mui-focusVisible")) {
        shadows.focusVisible.push(resolvedShadow);
      } else if (rule.selectorText.includes(".Mui-disabled")) {
        shadows.disabled.push(resolvedShadow);
      } else if (rule.selectorText === `.${styleClass}`) {
        shadows.rest.push(resolvedShadow);
      }
    }
  }

  for (const styleSheet of document.styleSheets) {
    collect(styleSheet.cssRules);
  }

  return shadows;
}

describe("Tile", () => {
  test.each(["light", "dark"] as const)(
    "matches contained Button elevations in %s mode",
    async (mode) => {
      const theme = createTheme({
        palette: { mode },
        transitions: { duration: { short: 0 } },
      });
      const screen = await render(
        <MUIThemeProvider theme={theme}>
          <Button variant="contained">MUI reference</Button>
          <Tile label="Tile reference" onClick={vi.fn()} />
          <Button variant="contained" disabled>
            Disabled MUI reference
          </Button>
          <Tile label="Disabled tile reference" onClick={vi.fn()} disabled />
        </MUIThemeProvider>,
      );

      const muiButton = screen.getByRole("button", {
        name: "MUI reference",
        exact: true,
      });
      const tile = screen.getByRole("button", {
        name: "Tile reference",
        exact: true,
      });
      const disabledMuiButton = screen.getByRole("button", {
        name: "Disabled MUI reference",
        exact: true,
      });
      const disabledTile = screen.getByRole("button", {
        name: "Disabled tile reference",
        exact: true,
      });

      const tileStateShadows = getStateShadows(tile.element());
      expect(tileStateShadows).toEqual(getStateShadows(muiButton.element()));
      expect(tileStateShadows).toEqual({
        rest: [resolveBoxShadow(theme.shadows[2])],
        hover: [
          resolveBoxShadow(theme.shadows[4]),
          resolveBoxShadow(theme.shadows[2]),
        ],
        active: [resolveBoxShadow(theme.shadows[8])],
        focusVisible: [resolveBoxShadow(theme.shadows[6])],
        disabled: [resolveBoxShadow(theme.shadows[0])],
      });

      expect(getComputedStyle(disabledTile.element()).boxShadow).toBe(
        getComputedStyle(disabledMuiButton.element()).boxShadow,
      );
      expect(getComputedStyle(disabledTile.element()).boxShadow).toBe(
        resolveBoxShadow(theme.shadows[0]),
      );
    },
  );

  test("forwards root element props and refs", async () => {
    const ref = createRef<HTMLButtonElement>();
    const screen = await render(
      <Tile ref={ref} data-scan-target="" label="Hello" onClick={vi.fn()} />,
    );

    const button = screen.getByRole("button", { name: "Hello" });
    await expect.element(button).toHaveAttribute("data-scan-target", "");
    expect(ref.current).toBe(button.element());
  });

  test("renders label without image when imageSrc is not provided", async () => {
    const screen = await render(<Tile label="Hello" onClick={vi.fn()} />);

    await expect
      .element(screen.getByRole("button", { name: "Hello" }))
      .toBeVisible();
  });

  test("renders with image when imageSrc is provided", async () => {
    const screen = await render(
      <Tile label="Cat" imageSrc={TEST_IMAGE_SRC} onClick={vi.fn()} />,
    );

    await expect
      .element(screen.getByRole("button", { name: "Cat" }))
      .toBeVisible();

    // Image is decorative (alt=""), use querySelector
    const img = screen.container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe(TEST_IMAGE_SRC);
  });

  test("renders the folder corner using the readable text color", async () => {
    const screen = await render(
      <Tile
        label="Folder"
        variant="folder"
        backgroundColor="#000000"
        borderColor="#000000"
        onClick={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: "Folder" });
    const styles = getComputedStyle(button.element());
    const afterStyles = getComputedStyle(button.element(), "::after");

    expect(afterStyles.display).toBe("block");
    expect(afterStyles.borderInlineEndColor).toBe(styles.color);
    expect(afterStyles.borderInlineEndColor).not.toBe(styles.borderColor);
  });

  test("applies backgroundColor and a readable text color", async () => {
    const screen = await render(
      <Tile label="Colored" backgroundColor="#000000" onClick={vi.fn()} />,
    );

    const button = screen.getByRole("button", { name: "Colored" });
    const styles = getComputedStyle(button.element());

    expect(styles.backgroundColor).toBe(
      resolveBackgroundColor("oklch(from #000000 l c h)"),
    );
    expect(styles.color).toBe("rgb(255, 255, 255)");
  });

  test("darkens only the background on hover", async () => {
    const theme = createTheme({ transitions: { duration: { short: 0 } } });
    const screen = await render(
      <MUIThemeProvider theme={theme}>
        <Tile label="Colored" backgroundColor="#ff0000" onClick={vi.fn()} />
      </MUIThemeProvider>,
    );

    const button = screen.getByRole("button", { name: "Colored" });
    await button.hover();

    const styles = getComputedStyle(button.element());
    expect(styles.backgroundColor).toBe(
      resolveBackgroundColor(
        "color-mix(in srgb, oklch(from #ff0000 l c h) 80%, black)",
      ),
    );
    expect(styles.filter).toBe("none");

    await button.unhover();
  });

  test("applies borderColor when provided", async () => {
    const screen = await render(
      <Tile label="Bordered" borderColor="#00ff00" onClick={vi.fn()} />,
    );

    const button = screen.getByRole("button", { name: "Bordered" });
    const styles = getComputedStyle(button.element());

    expect(styles.borderColor).toBe(resolveColor("oklch(from #00ff00 l c h)"));
  });

  test("defaults borderColor to backgroundColor when borderColor is omitted", async () => {
    const screen = await render(
      <Tile label="Match" backgroundColor="#ff0000" onClick={vi.fn()} />,
    );

    const button = screen.getByRole("button", { name: "Match" });
    const styles = getComputedStyle(button.element());

    expect(styles.borderColor).toBe(resolveColor("oklch(from #ff0000 l c h)"));
  });

  test("desaturates the background when --tile-saturation is set", async () => {
    const screen = await render(
      <div style={{ "--tile-saturation": 0 } as CSSProperties}>
        <Tile label="Muted" backgroundColor="#ff0000" onClick={vi.fn()} />
      </div>,
    );

    const button = screen.getByRole("button", { name: "Muted" });
    const styles = getComputedStyle(button.element());

    // chroma × 0 → achromatic gray at the original lightness
    expect(styles.backgroundColor).toBe(
      resolveColor("oklch(from #ff0000 l 0 h)"),
    );
  });

  test("borderHidden renders a transparent border but keeps its width", async () => {
    const screen = await render(
      <Tile
        label="Borderless"
        backgroundColor="#ff0000"
        borderColor="#00ff00"
        borderHidden
        onClick={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: "Borderless" });
    const styles = getComputedStyle(button.element());

    expect(styles.borderColor).toBe("rgba(0, 0, 0, 0)");
    expect(styles.borderTopWidth).toBe("4px");
    expect(styles.backgroundColor).toBe(
      resolveColor("oklch(from #ff0000 l c h)"),
    );
  });

  test("borderHidden keeps the folder corner visible", async () => {
    const screen = await render(
      <Tile
        label="Folder"
        variant="folder"
        backgroundColor="#000000"
        borderColor="#000000"
        borderHidden
        onClick={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: "Folder" });
    const styles = getComputedStyle(button.element());
    const afterStyles = getComputedStyle(button.element(), "::after");

    expect(afterStyles.display).toBe("block");
    expect(afterStyles.borderInlineEndColor).toBe(styles.color);
  });

  test("calls onClick when clicked", async () => {
    const onClick = vi.fn();

    const screen = await render(<Tile label="Click me" onClick={onClick} />);

    const button = screen.getByRole("button", { name: "Click me" });
    await button.click();

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("does not call onClick when disabled", async () => {
    const onClick = vi.fn();

    const screen = await render(
      <Tile label="Disabled tile" onClick={onClick} disabled />,
    );

    const button = screen.getByRole("button", { name: "Disabled tile" });
    await expect.element(button).toBeDisabled();
    expect(getComputedStyle(button.element()).boxShadow).toBe("none");
    await button.click({ force: true });

    expect(onClick).not.toHaveBeenCalled();
  });
});
