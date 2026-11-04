import { assertDefined } from "@shared/testing/assert-defined";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import type { SymbolLabelPlacement } from "../board-types";
import { TEST_IMAGE_SRC } from "../testing";
import { AACSymbol } from "./aac-symbol";

async function renderSymbol(labelPlacement?: SymbolLabelPlacement) {
  const screen = await render(
    <div style={{ width: 120, height: 120 }}>
      <AACSymbol
        imageSrc={TEST_IMAGE_SRC}
        label="Action"
        labelPlacement={labelPlacement}
      />
    </div>,
  );
  const image = screen.container.querySelector("img");
  assertDefined(image);

  return {
    label: screen.locator.getByText("Action").element().getBoundingClientRect(),
    image: image.getBoundingClientRect(),
  };
}

describe("AACSymbol", () => {
  test("renders nothing without an image or label", async () => {
    const screen = await render(<AACSymbol label="" />);

    expect(screen.container.textContent).toBe("");
    expect(screen.container.querySelector("img")).toBeNull();
  });

  test("renders a text-only symbol without an image", async () => {
    const screen = await render(<AACSymbol label="Hello" />);

    await expect.element(screen.getByText("Hello")).toBeVisible();
    expect(screen.container.querySelector("img")).toBeNull();
  });

  test("renders the image as decorative so the label names the symbol", async () => {
    const screen = await render(
      <AACSymbol imageSrc={TEST_IMAGE_SRC} label="" />,
    );

    const image = screen.container.querySelector("img");
    expect(image?.getAttribute("src")).toBe(TEST_IMAGE_SRC);
    expect(image?.getAttribute("alt")).toBe("");
  });

  test("places the label below the image by default and above it when placed on top", async () => {
    const byDefault = await renderSymbol();
    const top = await renderSymbol("top");

    expect(byDefault.label.top).toBeGreaterThanOrEqual(byDefault.image.bottom);
    expect(top.label.bottom).toBeLessThanOrEqual(top.image.top);
  });

  test("keeps a hidden label in the DOM without taking space from the image", async () => {
    const visible = await renderSymbol("bottom");
    const hidden = await renderSymbol("hidden");

    expect(hidden.label.width).toBeLessThanOrEqual(1);
    expect(hidden.image.height).toBeGreaterThan(visible.image.height);
  });
});
