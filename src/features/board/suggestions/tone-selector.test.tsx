import { describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { ToneSelector } from "./tone-selector";

describe("ToneSelector", () => {
  test.each([
    ["as-is", "direct tone"],
    ["more-formal", "professional tone"],
    ["more-casual", "friendly tone"],
  ] as const)("checks %s as the %s radio", async (tone, label) => {
    const screen = await render(
      <ToneSelector tone={tone} onChange={vi.fn()} />,
    );

    await expect
      .element(screen.getByRole("radio", { name: label }))
      .toBeChecked();
  });

  test("calls onChange with new tone when selection changes", async () => {
    const onChange = vi.fn();

    const screen = await render(
      <ToneSelector tone="as-is" onChange={onChange} />,
    );

    await screen.getByRole("radio", { name: "professional tone" }).click();

    expect(onChange).toHaveBeenCalledWith("more-formal");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test("moves selection with arrow keys", async () => {
    const onChange = vi.fn();

    const screen = await render(
      <ToneSelector tone="as-is" onChange={onChange} />,
    );

    screen.getByRole("radio", { name: "direct tone" }).element().focus();
    await userEvent.keyboard("{ArrowRight}");

    expect(onChange).toHaveBeenCalledWith("more-formal");
  });

  test("does not call onChange when clicking already selected tone", async () => {
    const onChange = vi.fn();

    const screen = await render(
      <ToneSelector tone="as-is" onChange={onChange} />,
    );

    await screen.getByRole("radio", { name: "direct tone" }).click();

    expect(onChange).not.toHaveBeenCalled();
  });

  test("disables the radios when disabled", async () => {
    const screen = await render(
      <ToneSelector tone="as-is" disabled onChange={vi.fn()} />,
    );

    await expect
      .element(screen.getByRole("radio", { name: "professional tone" }))
      .toBeDisabled();
  });
});
