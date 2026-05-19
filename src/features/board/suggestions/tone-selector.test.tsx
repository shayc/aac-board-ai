import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { ToneSelector } from "./tone-selector";

describe("ToneSelector", () => {
  test.each([
    ["as-is", "direct tone"],
    ["more-formal", "professional tone"],
    ["more-casual", "friendly tone"],
  ] as const)("highlights %s as the %s button", async (tone, label) => {
    const screen = await render(
      <ToneSelector tone={tone} onChange={vi.fn()} />,
    );

    await expect
      .element(screen.getByRole("button", { name: label }))
      .toHaveAttribute("aria-pressed", "true");
  });

  test("calls onChange with new tone when selection changes", async () => {
    const onChange = vi.fn();

    const screen = await render(
      <ToneSelector tone="as-is" onChange={onChange} />,
    );

    const professionalButton = screen.getByRole("button", {
      name: "professional tone",
    });
    await professionalButton.click();

    expect(onChange).toHaveBeenCalledWith("more-formal");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test("does not call onChange when clicking already selected tone", async () => {
    const onChange = vi.fn();

    const screen = await render(
      <ToneSelector tone="as-is" onChange={onChange} />,
    );

    const directButton = screen.getByRole("button", { name: "direct tone" });
    await directButton.click();

    expect(onChange).not.toHaveBeenCalled();
  });
});
