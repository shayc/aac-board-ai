import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { MessageBar } from "./MessageBar";
import type { MessagePart } from "./useMessage";

function createHandlers() {
  return {
    onBackspacePress: vi.fn(),
    onBackspaceLongPress: vi.fn(),
    onPlayClick: vi.fn(),
    onStopClick: vi.fn(),
  };
}

describe("MessageBar", () => {
  test("renders empty message with controls available", async () => {
    const handlers = createHandlers();

    const screen = await render(
      <MessageBar message={[]} isPlaying={false} {...handlers} />,
    );

    await expect
      .element(screen.getByRole("button", { name: "Backspace" }))
      .toBeVisible();

    await expect
      .element(screen.getByRole("button", { name: "Play message" }))
      .toBeVisible();
  });

  test("renders multiple message parts in correct order", async () => {
    const handlers = createHandlers();

    const messageParts: MessagePart[] = [
      { id: "1", label: "I" },
      { id: "2", label: "want" },
      { id: "3", label: "water" },
    ];

    const screen = await render(
      <MessageBar message={messageParts} isPlaying={false} {...handlers} />,
    );

    await expect.element(screen.getByText("I")).toBeVisible();
    await expect.element(screen.getByText("want")).toBeVisible();
    await expect.element(screen.getByText("water")).toBeVisible();

    const allText = screen.container.textContent ?? "";
    const iIndex = allText.indexOf("I");
    const wantIndex = allText.indexOf("want");
    const waterIndex = allText.indexOf("water");

    expect(iIndex).toBeGreaterThan(-1);
    expect(wantIndex).toBeGreaterThan(-1);
    expect(waterIndex).toBeGreaterThan(-1);
    expect(iIndex).toBeLessThan(wantIndex);
    expect(wantIndex).toBeLessThan(waterIndex);
  });
});
