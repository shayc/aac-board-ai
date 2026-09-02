import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { TEST_IMAGE_SRC } from "../testing";
import { AACSymbol } from "./aac-symbol";

describe("AACSymbol", () => {
  test("renders no content when no image source or label is provided", async () => {
    const screen = await render(<AACSymbol label="" />);

    expect(screen.container.textContent).toBe("");
    expect(screen.container.querySelector("img")).toBeNull();
  });

  test("renders label when provided", async () => {
    const screen = await render(<AACSymbol label="Hello" />);
    const label = screen.getByText("Hello");

    await expect.element(label).toBeVisible();
    expect(getComputedStyle(label.element()).fontWeight).toBe("600");
    expect(screen.container.querySelector("img")).toBeNull();
  });

  test("renders image when imageSrc is provided", async () => {
    const screen = await render(
      <AACSymbol imageSrc={TEST_IMAGE_SRC} label="" />,
    );

    const img = screen.container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe(TEST_IMAGE_SRC);
    expect(img?.getAttribute("alt")).toBe("");
  });

  test("places the label above the image when labelPlacement is top", async () => {
    const screen = await render(
      <AACSymbol
        imageSrc={TEST_IMAGE_SRC}
        label="Action"
        labelPlacement="top"
      />,
    );

    const container = screen.getByText("Action").element().parentElement;
    if (!container) {
      throw new Error("AAC symbol container not found");
    }
    expect(getComputedStyle(container).flexDirection).toBe("column-reverse");
  });

  test("keeps the label accessible when labelPlacement is hidden", async () => {
    const screen = await render(
      <AACSymbol
        imageSrc={TEST_IMAGE_SRC}
        label="Action"
        labelPlacement="hidden"
      />,
    );

    await expect.element(screen.getByText("Action")).toBeInTheDocument();
  });

  test("takes no layout space for the label when labelPlacement is hidden", async () => {
    const screen = await render(
      <AACSymbol
        imageSrc={TEST_IMAGE_SRC}
        label="Action"
        labelPlacement="hidden"
      />,
    );

    const label = screen.getByText("Action").element();
    expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(1);
  });
});
