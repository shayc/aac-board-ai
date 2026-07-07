import type { CSSProperties } from "react";
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

describe("Tile", () => {
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

  test("renders folder corner indicator when variant is folder", async () => {
    const screen = await render(
      <Tile
        label="Folder"
        variant="folder"
        borderColor="#000000"
        onClick={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: "Folder" });
    const afterStyles = getComputedStyle(button.element(), "::after");

    expect(afterStyles.display).toBe("block");
  });

  test("applies backgroundColor and a readable text color", async () => {
    const screen = await render(
      <Tile label="Colored" backgroundColor="#000000" onClick={vi.fn()} />,
    );

    const button = screen.getByRole("button", { name: "Colored" });
    const styles = getComputedStyle(button.element());

    expect(styles.backgroundColor).toBe(
      resolveColor("oklch(from #000000 l c h)"),
    );
    expect(styles.color).toBe("rgb(255, 255, 255)");
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
    await button.click({ force: true });

    expect(onClick).not.toHaveBeenCalled();
  });
});
