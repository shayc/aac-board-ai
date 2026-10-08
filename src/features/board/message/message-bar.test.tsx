import { AppProviders } from "@shared/providers/app-providers";
import { assertDefined } from "@shared/testing/assert-defined";
import type { ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { TEST_IMAGE_SRC } from "../testing";
import { MessageBar, type MessageBarProps } from "./message-bar";
import type { MessagePart } from "./message-types";

function renderWithProviders(children: ReactNode) {
  return render(<AppProviders>{children}</AppProviders>);
}

function createProps(
  overrides: Partial<MessageBarProps> = {},
): MessageBarProps {
  return {
    parts: [],
    activePartId: null,
    isPlaying: false,
    onPlay: vi.fn(),
    onStop: vi.fn(),
    ...overrides,
  };
}

const SCROLL_PARTS: MessagePart[] = Array.from({ length: 10 }, (_, index) => ({
  id: String(index),
  label: `Part ${index + 1}`,
  imageSrc: TEST_IMAGE_SRC,
}));

function ScrollableMessageBar(props: MessageBarProps) {
  return (
    <AppProviders>
      <div style={{ width: 320 }}>
        <MessageBar {...props} />
      </div>
    </AppProviders>
  );
}

function getScrollContainer(container: Element): HTMLElement {
  const scroller = Array.from(
    container.querySelectorAll<HTMLElement>("div"),
  ).find((element) => getComputedStyle(element).overflowX === "auto");
  assertDefined(scroller);

  return scroller;
}

function waitForAnimationFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

describe("MessageBar", () => {
  test("renders a label for each message part", async () => {
    const parts: MessagePart[] = [
      { id: "a", label: "I" },
      { id: "b", label: "want" },
      { id: "c", label: "water" },
    ];

    const screen = await renderWithProviders(
      <MessageBar {...createProps({ parts })} />,
    );

    await expect.element(screen.getByText("I")).toBeVisible();
    await expect.element(screen.getByText("want")).toBeVisible();
    await expect.element(screen.getByText("water")).toBeVisible();
  });

  test("re-enables text selection so the composed message can be copied", async () => {
    const parts: MessagePart[] = [{ id: "a", label: "I" }];

    const screen = await renderWithProviders(
      <MessageBar {...createProps({ parts })} />,
    );

    const label = screen.getByText("I").element();
    const styles = getComputedStyle(label);

    expect(styles.userSelect).toBe("text");
  });

  describe("scroll-into-view", () => {
    test("scrolls the newest part to the trailing edge when a part is added", async () => {
      const props = createProps();
      const screen = await render(<ScrollableMessageBar {...props} />);
      const scroller = getScrollContainer(screen.container);

      expect(scroller.scrollLeft).toBe(0);

      await screen.rerender(
        <ScrollableMessageBar {...props} parts={SCROLL_PARTS} />,
      );
      await waitForAnimationFrame();

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
      const screen = await render(<ScrollableMessageBar {...props} />);
      const scroller = getScrollContainer(screen.container);
      await waitForAnimationFrame();

      const activePart = scroller.children[3];
      const initialScrollLeft = scroller.scrollLeft;
      expect(activePart.getBoundingClientRect().right).toBeLessThan(
        scroller.getBoundingClientRect().left,
      );

      // Keep the parts reference so only active-part scrolling is triggered.
      await screen.rerender(
        <ScrollableMessageBar
          {...props}
          isPlaying
          activePartId={SCROLL_PARTS[3].id}
        />,
      );
      await waitForAnimationFrame();

      expect(scroller.scrollLeft).toBeLessThan(initialScrollLeft);
      expect(activePart.getBoundingClientRect().left).toBeCloseTo(
        scroller.getBoundingClientRect().left,
        0,
      );
      expect(activePart.getBoundingClientRect().right).toBeLessThanOrEqual(
        scroller.getBoundingClientRect().right,
      );
    });

    test("preserves the scroll position when playback becomes idle", async () => {
      const props = createProps({
        parts: SCROLL_PARTS,
        activePartId: SCROLL_PARTS[3].id,
        isPlaying: true,
      });
      const screen = await render(<ScrollableMessageBar {...props} />);
      const scroller = getScrollContainer(screen.container);
      await waitForAnimationFrame();
      expect(scroller.scrollLeft).toBeGreaterThan(0);

      scroller.scrollLeft = 0;
      await screen.rerender(
        <ScrollableMessageBar
          {...props}
          activePartId={null}
          isPlaying={false}
        />,
      );
      await waitForAnimationFrame();

      expect(scroller.scrollLeft).toBe(0);
    });
  });

  describe("controls", () => {
    test("delegates play to onPlay while idle", async () => {
      const onPlay = vi.fn();

      const screen = await renderWithProviders(
        <MessageBar
          {...createProps({
            parts: [{ id: "a", label: "Hello" }],
            isPlaying: false,
            onPlay,
          })}
        />,
      );

      await screen.getByRole("button", { name: "Play message" }).click();

      expect(onPlay).toHaveBeenCalledTimes(1);
    });

    test("delegates stop to onStop while playing", async () => {
      const onStop = vi.fn();

      const screen = await renderWithProviders(
        <MessageBar {...createProps({ isPlaying: true, onStop })} />,
      );

      await screen.getByRole("button", { name: "Stop message" }).click();

      expect(onStop).toHaveBeenCalledTimes(1);
    });
  });
});
