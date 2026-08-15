import { AppProviders } from "@shared/providers/app-providers";
import type { ReactNode } from "react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
  type MockInstance,
} from "vitest";
import { render } from "vitest-browser-react";
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

let scrollIntoView: MockInstance<Element["scrollIntoView"]>;

function lastScrollCall() {
  const { calls, contexts } = scrollIntoView.mock;
  const index = calls.length - 1;
  return {
    options: calls[index][0] as ScrollIntoViewOptions,
    element: contexts[index] as Element,
  };
}

beforeEach(() => {
  scrollIntoView = vi
    .spyOn(Element.prototype, "scrollIntoView")
    .mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

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
      const screen = await renderWithProviders(
        <MessageBar {...createProps({ parts: [] })} />,
      );

      expect(scrollIntoView).not.toHaveBeenCalled();

      await screen.rerender(
        <AppProviders>
          <MessageBar
            {...createProps({
              parts: [
                { id: "a", label: "I" },
                { id: "b", label: "want" },
              ],
            })}
          />
        </AppProviders>,
      );

      await vi.waitFor(() => {
        expect(scrollIntoView).toHaveBeenCalled();
        const { options, element } = lastScrollCall();
        expect(options).toEqual({
          block: "nearest",
          inline: "end",
          behavior: "instant",
        });
        expect(element.textContent).toContain("want");
      });
    });

    test("scrolls the active part into view when it changes during playback", async () => {
      const parts: MessagePart[] = [
        { id: "a", label: "I" },
        { id: "b", label: "want" },
        { id: "c", label: "water" },
      ];

      const screen = await renderWithProviders(
        <MessageBar {...createProps({ parts })} />,
      );

      // Drain the mount-time scroll-to-end so only the active-part scroll remains.
      await vi.waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
      scrollIntoView.mockClear();

      // Same `parts` reference: the append effect stays put, isolating the
      // active-part effect we are asserting on.
      await screen.rerender(
        <AppProviders>
          <MessageBar {...createProps({ parts, activePartId: "b" })} />
        </AppProviders>,
      );

      await vi.waitFor(() => {
        expect(scrollIntoView).toHaveBeenCalled();
        const { options, element } = lastScrollCall();
        expect(options).toEqual({
          block: "nearest",
          inline: "nearest",
          behavior: "instant",
        });
        expect(element.textContent).toContain("want");
      });
    });

    test("performs no active-part scroll while idle", async () => {
      const parts: MessagePart[] = [
        { id: "a", label: "I" },
        { id: "b", label: "want" },
      ];

      await renderWithProviders(
        <MessageBar {...createProps({ parts, activePartId: null })} />,
      );

      await vi.waitFor(() => expect(scrollIntoView).toHaveBeenCalled());

      const scrolledToActive = scrollIntoView.mock.calls.some(
        ([options]) => (options as ScrollIntoViewOptions).inline === "nearest",
      );
      expect(scrolledToActive).toBe(false);
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
