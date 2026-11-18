import { renderWithProviders } from "@shared/testing/render-with-providers";
import { describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { HomeButton } from "./home-button";

describe("HomeButton", () => {
  test("calls onClick when the enabled button is clicked", async () => {
    const onClick = vi.fn();
    const screen = await renderWithProviders(
      <HomeButton disabled={false} onClick={onClick} />,
    );

    await screen.getByRole("button", { name: "Go home" }).click();

    expect(onClick).toHaveBeenCalledOnce();
  });

  test("stays focusable but inert while disabled", async () => {
    const onClick = vi.fn();
    const screen = await renderWithProviders(
      <HomeButton disabled onClick={onClick} />,
    );
    const home = screen.getByRole("button", { name: "Go home" });

    await expect.element(home).toHaveAttribute("aria-disabled", "true");

    await userEvent.tab();
    await expect.element(home).toHaveFocus();
    await userEvent.keyboard("{Enter}");

    expect(onClick).not.toHaveBeenCalled();
  });
});
