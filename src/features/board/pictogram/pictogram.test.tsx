import { TEST_IMAGE_SRC } from "@shared/testing/fixtures";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Pictogram } from "./pictogram";

describe("Pictogram", () => {
  test("renders no content when no src or label is provided", async () => {
    const screen = await render(<Pictogram label="" />);

    expect(screen.container.textContent).toBe("");
    expect(screen.container.querySelector("img")).toBeNull();
  });

  test("renders label when provided", async () => {
    const screen = await render(<Pictogram label="Hello" />);

    await expect.element(screen.getByText("Hello")).toBeVisible();
    expect(screen.container.querySelector("img")).toBeNull();
  });

  test("renders image when src is provided", async () => {
    const screen = await render(<Pictogram src={TEST_IMAGE_SRC} label="" />);

    const img = screen.container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe(TEST_IMAGE_SRC);
    expect(img?.getAttribute("alt")).toBe("");
  });

  test("renders both image and label when both are provided", async () => {
    const screen = await render(
      <Pictogram src={TEST_IMAGE_SRC} label="Action" />,
    );

    await expect.element(screen.getByText("Action")).toBeVisible();
    expect(screen.container.querySelector("img")).not.toBeNull();
  });

  test("places the label above the image when labelPlacement is top", async () => {
    const screen = await render(
      <Pictogram src={TEST_IMAGE_SRC} label="Action" labelPlacement="top" />,
    );

    const container = screen.getByText("Action").element().parentElement;
    if (!container) {
      throw new Error("Pictogram container not found");
    }
    expect(getComputedStyle(container).flexDirection).toBe("column-reverse");
  });

  test("keeps the label accessible when labelPlacement is hidden", async () => {
    const screen = await render(
      <Pictogram src={TEST_IMAGE_SRC} label="Action" labelPlacement="hidden" />,
    );

    await expect.element(screen.getByText("Action")).toBeInTheDocument();
  });

  test("takes no layout space for the label when labelPlacement is hidden", async () => {
    const screen = await render(
      <Pictogram src={TEST_IMAGE_SRC} label="Action" labelPlacement="hidden" />,
    );

    const label = screen.getByText("Action").element();
    expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(1);
  });
});
