import { TEST_IMAGE_SRC } from "@shared/testing/fixtures";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Pictogram } from "./Pictogram";

describe("Pictogram", () => {
  test("renders no content when no src or label is provided", async () => {
    const screen = await render(<Pictogram />);

    expect(screen.container.textContent).toBe("");
    expect(screen.container.querySelector("img")).toBeNull();
  });

  test("renders label when provided", async () => {
    const screen = await render(<Pictogram label="Hello" />);

    await expect.element(screen.getByText("Hello")).toBeVisible();
    expect(screen.container.querySelector("img")).toBeNull();
  });

  test("renders image when src is provided", async () => {
    const screen = await render(<Pictogram src={TEST_IMAGE_SRC} />);

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
});
