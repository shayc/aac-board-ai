import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { BackspaceButton } from "./BackspaceButton";

function createHandlers() {
  return {
    onPress: vi.fn(),
    onLongPress: vi.fn(),
  };
}

describe("BackspaceButton", () => {
  test("calls onPress when clicked", async () => {
    const handlers = createHandlers();

    const screen = await render(<BackspaceButton {...handlers} />);

    const button = screen.getByRole("button", { name: "Backspace" });
    await button.click();

    expect(handlers.onPress).toHaveBeenCalledTimes(1);
    expect(handlers.onLongPress).not.toHaveBeenCalled();
  });
});
