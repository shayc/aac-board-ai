import { TEST_IMAGE_SRC } from "@shared/testing/fixtures";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { Tile } from "./tile";

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

    expect(styles.backgroundColor).toBe("rgb(0, 0, 0)");
    expect(styles.color).toBe("rgb(255, 255, 255)");
  });

  test("applies borderColor when provided", async () => {
    const screen = await render(
      <Tile label="Bordered" borderColor="#00ff00" onClick={vi.fn()} />,
    );

    const button = screen.getByRole("button", { name: "Bordered" });
    const styles = getComputedStyle(button.element());

    expect(styles.borderColor).toBe("rgb(0, 255, 0)");
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

  test("respects tabIndex for keyboard navigation", async () => {
    const screen = await render(
      <Tile label="Focusable" onClick={vi.fn()} tabIndex={0} />,
    );

    const button = screen.getByRole("button", { name: "Focusable" });
    await expect.element(button).toHaveAttribute("tabindex", "0");
  });

  test("can be removed from tab order with tabIndex -1", async () => {
    const screen = await render(
      <Tile label="Not focusable" onClick={vi.fn()} tabIndex={-1} />,
    );

    const button = screen.getByRole("button", { name: "Not focusable" });
    await expect.element(button).toHaveAttribute("tabindex", "-1");
  });
});
