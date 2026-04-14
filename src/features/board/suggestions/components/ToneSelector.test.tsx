import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { ToneSelector } from "./ToneSelector";

describe("ToneSelector", () => {
  test("highlights direct tone when selected", async () => {
    const onChange = vi.fn();

    const screen = await render(
      <ToneSelector tone="as-is" onChange={onChange} />,
    );

    const directButton = screen.getByRole("button", { name: "direct tone" });
    await expect.element(directButton).toHaveAttribute("aria-pressed", "true");
  });

  test("highlights professional tone when selected", async () => {
    const onChange = vi.fn();

    const screen = await render(
      <ToneSelector tone="more-formal" onChange={onChange} />,
    );

    const professionalButton = screen.getByRole("button", {
      name: "professional tone",
    });
    await expect
      .element(professionalButton)
      .toHaveAttribute("aria-pressed", "true");
  });

  test("highlights friendly tone when selected", async () => {
    const onChange = vi.fn();

    const screen = await render(
      <ToneSelector tone="more-casual" onChange={onChange} />,
    );

    const friendlyButton = screen.getByRole("button", {
      name: "friendly tone",
    });
    await expect
      .element(friendlyButton)
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
