import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { BackspaceButton } from "./BackspaceButton";

describe("BackspaceButton", () => {
  test("calls onPress when clicked", async () => {
    const onPress = vi.fn();
    const onLongPress = vi.fn();

    const screen = await render(
      <BackspaceButton onPress={onPress} onLongPress={onLongPress} />,
    );

    const button = screen.getByRole("button", { name: "Backspace" });
    await button.click();

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onLongPress).not.toHaveBeenCalled();
  });
});
