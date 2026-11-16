import { assertDefined } from "@shared/testing/assert-defined";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { renderWithProviders } from "@shared/testing/render-with-providers";
import { TEST_IMAGE_SRC } from "@shared/testing/test-image";
import { describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { MessageBar, type MessageBarProps } from "./message-bar";
import type { MessagePart } from "./message-types";

const SCROLL_PARTS: MessagePart[] = Array.from({ length: 10 }, (_, index) => ({
  kind: "tile",
  id: String(index),
  label: `Part ${index + 1}`,
  language: "en",
  imageSrc: TEST_IMAGE_SRC,
}));
const ACTIVE_SCROLL_PART_INDEX = 3;
const ACTIVE_SCROLL_PART_ID = String(ACTIVE_SCROLL_PART_INDEX);

function createProps(
  overrides: Partial<MessageBarProps> = {},
): MessageBarProps {
  return {
    parts: [],
    isWordOpen: false,
    activePartId: null,
    areImagesVisible: true,
    ...overrides,
  };
}

function ScrollableMessageBar(props: MessageBarProps) {
  return (
    <div style={{ width: 320 }}>
      <MessageBar {...props} />
    </div>
  );
}

function getScrollContainer(container: Element): HTMLElement {
  const scroller = Array.from(
    container.querySelectorAll<HTMLElement>("div"),
  ).find((element) => getComputedStyle(element).overflowX === "auto");
  assertDefined(scroller);

  return scroller;
}

describe("MessageBar", () => {
  test("renders a label for each tile and text part", async () => {
    const parts: MessagePart[] = [
      {
        kind: "tile",
        id: "a",
        label: "I",
        language: "en",
        imageSrc: TEST_IMAGE_SRC,
      },
      { kind: "tile", id: "b", label: "want", language: "en" },
      { kind: "text", id: "c", label: "water", language: "en" },
    ];

    const screen = await renderWithProviders(
      <MessageBar {...createProps({ parts })} />,
    );

    await expect.element(screen.getByText("I")).toBeVisible();
    await expect.element(screen.getByText("want")).toBeVisible();
    await expect.element(screen.getByText("water")).toBeVisible();
  });

  test("marks each part with its own language", async () => {
    const parts: MessagePart[] = [
      { kind: "tile", id: "a", label: "I", language: "en" },
      { kind: "text", id: "b", label: "agua", language: "es" },
      { kind: "text", id: "c", label: "water", language: undefined },
    ];

    const screen = await renderWithProviders(
      <MessageBar {...createProps({ parts })} />,
    );

    const items = screen.getByRole("listitem");
    await expect.element(items.nth(0)).toHaveAttribute("lang", "en");
    await expect.element(items.nth(1)).toHaveAttribute("lang", "es");
    await expect.element(items.nth(2)).not.toHaveAttribute("lang");
  });

  test("keeps its height when the first part is added", async () => {
    const props = createProps();
    const screen = await renderWithProviders(<MessageBar {...props} />);
    const bar = screen
      .getByRole("list", { name: "Message" })
      .element().parentElement;
    assertDefined(bar);
    const emptyHeight = bar.getBoundingClientRect().height;

    await screen.rerender(
      <MessageBar
        {...props}
        parts={[
          {
            kind: "tile",
            id: "a",
            label: "want",
            language: "en",
            imageSrc: TEST_IMAGE_SRC,
          },
        ]}
      />,
    );
    await expect.element(screen.getByText("want")).toBeVisible();

    expect(bar.getBoundingClientRect().height).toBe(emptyHeight);
  });

  test.each([
    { isWordOpen: true, caret: '""' },
    { isWordOpen: false, caret: "none" },
  ])(
    "marks the last word with a caret only while it is open ($isWordOpen)",
    async ({ isWordOpen, caret }) => {
      const parts: MessagePart[] = [
        { kind: "text", id: "a", label: "I", language: "en" },
        { kind: "text", id: "b", label: "want", language: "en" },
      ];

      const screen = await renderWithProviders(
        <MessageBar {...createProps({ parts, isWordOpen })} />,
      );
      const items = screen.getByRole("listitem").elements();
      const carets = items.map(
        (item) => getComputedStyle(item, "::after").content,
      );

      expect(carets).toEqual(["none", caret]);
    },
  );

  test("exposes the message as a named list of its parts", async () => {
    const parts: MessagePart[] = [
      { kind: "tile", id: "a", label: "I", language: "en" },
      { kind: "tile", id: "b", label: "want", language: "en" },
    ];

    const screen = await renderWithProviders(
      <MessageBar {...createProps({ parts })} />,
    );
    const message = screen.getByRole("list", { name: "Message" });

    await expect.element(message).toBeVisible();
    await expect.element(message.getByRole("listitem")).toHaveLength(2);
    await expect
      .element(message.getByRole("listitem").first())
      .toHaveTextContent("I");
  });

  test("lets the keyboard reach a message longer than the bar", async () => {
    const screen = await renderWithProviders(
      <ScrollableMessageBar {...createProps({ parts: SCROLL_PARTS })} />,
    );
    const message = screen.getByRole("list", { name: "Message" });
    expect(message.element().scrollLeft).toBeGreaterThan(0);

    await userEvent.tab();

    await expect.element(message).toHaveFocus();
    await expectNoA11yViolations(screen.container);
  });

  test("keeps an empty message out of the tab order", async () => {
    const screen = await renderWithProviders(<MessageBar {...createProps()} />);

    await expect
      .element(screen.getByRole("list", { name: "Message" }))
      .not.toHaveAttribute("tabindex");
  });

  test("re-enables text selection so the composed message can be copied", async () => {
    const parts: MessagePart[] = [
      { kind: "tile", id: "a", label: "I", language: "en" },
    ];

    const screen = await renderWithProviders(
      <MessageBar {...createProps({ parts })} />,
    );

    await userEvent.tripleClick(screen.getByText("I"));

    expect(getSelection()?.toString()).toContain("I");
  });

  test("shows labels without images when images are hidden", async () => {
    const parts: MessagePart[] = [
      {
        kind: "tile",
        id: "a",
        label: "I",
        language: "en",
        imageSrc: TEST_IMAGE_SRC,
      },
      {
        kind: "tile",
        id: "b",
        label: "",
        language: "en",
        imageSrc: TEST_IMAGE_SRC,
      },
    ];

    const screen = await renderWithProviders(
      <MessageBar {...createProps({ parts, areImagesVisible: false })} />,
    );

    await expect.element(screen.getByText("I")).toBeVisible();
    expect(screen.container.querySelectorAll("img")).toHaveLength(1);
  });

  describe("scroll-into-view", () => {
    test("scrolls the newest part to the trailing edge when a part is added", async () => {
      const props = createProps();
      const screen = await renderWithProviders(
        <ScrollableMessageBar {...props} />,
      );
      const scroller = getScrollContainer(screen.container);

      expect(scroller.scrollLeft).toBe(0);

      await screen.rerender(
        <ScrollableMessageBar {...props} parts={SCROLL_PARTS} />,
      );

      const lastPart = scroller.lastElementChild;
      assertDefined(lastPart);
      expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
      expect(scroller.scrollLeft).toBeGreaterThan(0);
      expect(lastPart.getBoundingClientRect().right).toBeCloseTo(
        scroller.getBoundingClientRect().right,
        0,
      );
    });

    test("scrolls the active part into view when it changes during playback", async () => {
      const props = createProps({ parts: SCROLL_PARTS });
      const screen = await renderWithProviders(
        <ScrollableMessageBar {...props} />,
      );
      const scroller = getScrollContainer(screen.container);

      const activePart = scroller.children[ACTIVE_SCROLL_PART_INDEX];
      assertDefined(activePart);

      const initialScrollLeft = scroller.scrollLeft;
      expect(activePart.getBoundingClientRect().right).toBeLessThan(
        scroller.getBoundingClientRect().left,
      );

      // Keep the parts reference so only active-part scrolling is triggered.
      await screen.rerender(
        <ScrollableMessageBar
          {...props}
          activePartId={ACTIVE_SCROLL_PART_ID}
        />,
      );

      expect(scroller.scrollLeft).toBeLessThan(initialScrollLeft);
      expect(activePart.getBoundingClientRect().left).toBeCloseTo(
        scroller.getBoundingClientRect().left,
        0,
      );
      expect(activePart.getBoundingClientRect().right).toBeLessThanOrEqual(
        scroller.getBoundingClientRect().right,
      );
    });

    test("keeps the newest part in view when an edit happens during playback", async () => {
      const props = createProps({
        parts: SCROLL_PARTS,
        activePartId: ACTIVE_SCROLL_PART_ID,
      });
      const screen = await renderWithProviders(
        <ScrollableMessageBar {...props} />,
      );
      const scroller = getScrollContainer(screen.container);

      await screen.rerender(
        <ScrollableMessageBar
          {...props}
          parts={[
            ...SCROLL_PARTS,
            { kind: "text", id: "newest", label: "newest", language: "en" },
          ]}
        />,
      );

      const lastPart = scroller.lastElementChild;
      assertDefined(lastPart);
      expect(lastPart.getBoundingClientRect().right).toBeCloseTo(
        scroller.getBoundingClientRect().right,
        0,
      );
    });

    test("scrolls to the active part when an edit starts playback", async () => {
      const props = createProps({ parts: SCROLL_PARTS });
      const screen = await renderWithProviders(
        <ScrollableMessageBar {...props} />,
      );
      const scroller = getScrollContainer(screen.container);

      await screen.rerender(
        <ScrollableMessageBar
          {...props}
          parts={[
            ...SCROLL_PARTS,
            { kind: "text", id: "newest", label: "s", language: "en" },
          ]}
          activePartId={ACTIVE_SCROLL_PART_ID}
        />,
      );

      const activePart = scroller.children[ACTIVE_SCROLL_PART_INDEX];
      assertDefined(activePart);
      expect(activePart.getBoundingClientRect().left).toBeCloseTo(
        scroller.getBoundingClientRect().left,
        0,
      );
    });

    test("preserves the scroll position when playback becomes idle", async () => {
      const props = createProps({
        parts: SCROLL_PARTS,
        activePartId: ACTIVE_SCROLL_PART_ID,
      });
      const screen = await renderWithProviders(
        <ScrollableMessageBar {...props} />,
      );
      const scroller = getScrollContainer(screen.container);
      expect(scroller.scrollLeft).toBeGreaterThan(0);

      scroller.scrollLeft = 0;
      await screen.rerender(
        <ScrollableMessageBar {...props} activePartId={null} />,
      );

      expect(scroller.scrollLeft).toBe(0);
    });
  });
});
