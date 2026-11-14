import { assertDefined } from "@shared/testing/assert-defined";
import { TEST_IMAGE_SRC } from "@shared/testing/test-image";
import type { ComponentProps } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { AACSymbol } from "./aac-symbol";

async function renderSymbol(
  props: Partial<ComponentProps<typeof AACSymbol>> = {},
  height = 120,
) {
  const screen = await render(
    <div style={{ width: 120, height }}>
      <AACSymbol label="Action" imageSrc={TEST_IMAGE_SRC} {...props} />
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
  test("renders no content without an image or label", async () => {
    const screen = await render(<AACSymbol label="" />);

    expect(screen.container.textContent).toBe("");
    expect(screen.container.querySelector("img")).toBeNull();
  });

  test("renders a text-only symbol without an image", async () => {
    const screen = await render(<AACSymbol label="Hello" />);

    await expect.element(screen.getByText("Hello")).toBeVisible();
    expect(screen.container.querySelector("img")).toBeNull();
  });

  test("renders the image as decorative even without a label", async () => {
    const screen = await render(
      <AACSymbol label="" imageSrc={TEST_IMAGE_SRC} />,
    );

    const image = screen.container.querySelector("img");
    expect(image?.getAttribute("src")).toBe(TEST_IMAGE_SRC);
    expect(image?.getAttribute("alt")).toBe("");
  });

  test.each(["bottom", "top"] as const)(
    "gives an image without a label the full height with %s placement",
    async (labelPlacement) => {
      const screen = await render(
        <div style={{ width: 120, height: 120 }}>
          <AACSymbol
            label=""
            imageSrc={TEST_IMAGE_SRC}
            labelPlacement={labelPlacement}
          />
        </div>,
      );
      const image = screen.container.querySelector("img");
      assertDefined(image);

      const bounds = screen.container.getBoundingClientRect();

      expect(image.getBoundingClientRect()).toMatchObject({
        top: bounds.top,
        bottom: bounds.bottom,
      });
    },
  );

  test("renders only phrasing elements so it can sit inside a button", async () => {
    const screen = await render(
      <AACSymbol label="Hello" imageSrc={TEST_IMAGE_SRC} />,
    );

    const symbol = screen.container.firstElementChild;
    expect(symbol?.tagName).toBe("SPAN");
    expect(symbol?.querySelector("div")).toBeNull();
  });

  test("places the label below the image by default and above it when placed on top", async () => {
    const byDefault = await renderSymbol();
    const top = await renderSymbol({ labelPlacement: "top" });

    expect(byDefault.label.top).toBeGreaterThanOrEqual(byDefault.image.bottom);
    expect(top.label.bottom).toBeLessThanOrEqual(top.image.top);
  });

  test("shrinks the image, not the label, when both don't fit the height", async () => {
    const roomy = await renderSymbol();
    const tight = await renderSymbol({}, 60);

    expect(tight.label.height).toBe(roomy.label.height);
    expect(tight.image.height).toBeLessThan(roomy.image.height);
    expect(tight.image.bottom).toBeLessThanOrEqual(tight.label.top);
  });

  test("cuts a label that is too long at its end, whichever way the layout runs", async () => {
    const screen = await render(
      <div dir="rtl" style={{ width: 120, height: 120 }}>
        <AACSymbol label="A label too long to fit the tile" />
      </div>,
    );
    const label = screen
      .getByText("A label too long to fit the tile")
      .element();
    assertDefined(label.firstChild);

    const firstLetter = document.createRange();
    firstLetter.setStart(label.firstChild, 0);
    firstLetter.setEnd(label.firstChild, 1);

    expect(firstLetter.getBoundingClientRect().left).toBeCloseTo(
      label.getBoundingClientRect().left,
      0,
    );
  });

  test("keeps a hidden label in the DOM without taking space from the image", async () => {
    const visible = await renderSymbol();
    const hidden = await renderSymbol({ isLabelVisible: false });

    expect(hidden.label.width).toBeLessThanOrEqual(1);
    expect(hidden.image.height).toBeGreaterThan(visible.image.height);
  });

  test("keeps a hidden label visible when there is no image to show instead", async () => {
    const screen = await render(
      <AACSymbol label="Hello" isLabelVisible={false} />,
    );

    expect(
      screen.getByText("Hello").element().getBoundingClientRect().width,
    ).toBeGreaterThan(1);
  });

  test("shows only the label when the image is hidden", async () => {
    const screen = await render(
      <AACSymbol
        label="Hello"
        imageSrc={TEST_IMAGE_SRC}
        isImageVisible={false}
      />,
    );

    await expect.element(screen.getByText("Hello")).toBeVisible();
    expect(screen.container.querySelector("img")).toBeNull();
  });

  test("keeps a hidden image when the symbol has no label to show instead", async () => {
    const screen = await render(
      <AACSymbol label=" " imageSrc={TEST_IMAGE_SRC} isImageVisible={false} />,
    );

    expect(screen.container.querySelector("img")).not.toBeNull();
  });
});
