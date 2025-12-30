import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { Tile } from "./Tile";

describe("Tile", () => {
  test("calls onClick when clicked", async () => {
    const onClick = vi.fn();

    const screen = await render(<Tile label="Click me" onClick={onClick} />);

    const button = screen.getByRole("button", { name: "Click me" });
    await button.click();

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
