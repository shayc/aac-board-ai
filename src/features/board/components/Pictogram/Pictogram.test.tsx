import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Pictogram } from "./Pictogram";

// Minimal valid 1x1 transparent PNG as data URI (avoids network requests)
const TEST_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

describe("Pictogram", () => {
  test("renders label when provided", async () => {
    const screen = await render(<Pictogram label="Hello" />);

    await expect.element(screen.getByText("Hello")).toBeVisible();
    expect(screen.container.querySelector("img")).toBeNull();
  });

  test("renders image when src is provided", async () => {
    const screen = await render(<Pictogram src={TEST_IMAGE} label="Test" />);

    const img = screen.container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe(TEST_IMAGE);
    expect(img?.getAttribute("alt")).toBe("");
  });

  test("renders both image and label when both are provided", async () => {
    const screen = await render(<Pictogram src={TEST_IMAGE} label="Action" />);

    await expect.element(screen.getByText("Action")).toBeVisible();
    expect(screen.container.querySelector("img")).not.toBeNull();
  });

  test("renders no content when no src or label is provided", async () => {
    const screen = await render(<Pictogram />);

    expect(screen.container.textContent).toBe("");
    expect(screen.container.querySelector("img")).toBeNull();
  });

  test("renders only image when label is omitted", async () => {
    const screen = await render(<Pictogram src={TEST_IMAGE} />);

    const img = screen.container.querySelector("img");
    expect(img?.getAttribute("src")).toBe(TEST_IMAGE);
    expect(screen.container.textContent).toBe("");
  });
});
