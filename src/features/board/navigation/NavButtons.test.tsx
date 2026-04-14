import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { NavButtons } from "./NavButtons";

describe("NavButtons", () => {
  test("calls onBackClick when back button is clicked", async () => {
    const onBackClick = vi.fn();
    const onHomeClick = vi.fn();

    const screen = await render(
      <NavButtons
        canGoBack={true}
        canGoHome={true}
        onBackClick={onBackClick}
        onHomeClick={onHomeClick}
      />,
    );

    await screen.getByRole("button", { name: "Back" }).click();

    expect(onBackClick).toHaveBeenCalledOnce();
    expect(onHomeClick).not.toHaveBeenCalled();
  });

  test("calls onHomeClick when home button is clicked", async () => {
    const onBackClick = vi.fn();
    const onHomeClick = vi.fn();

    const screen = await render(
      <NavButtons
        canGoBack={true}
        canGoHome={true}
        onBackClick={onBackClick}
        onHomeClick={onHomeClick}
      />,
    );

    await screen.getByRole("button", { name: "Home" }).click();

    expect(onHomeClick).toHaveBeenCalledOnce();
    expect(onBackClick).not.toHaveBeenCalled();
  });

  test("disables back button when canGoBack is false", async () => {
    const screen = await render(
      <NavButtons
        canGoBack={false}
        canGoHome={true}
        onBackClick={vi.fn()}
        onHomeClick={vi.fn()}
      />,
    );

    await expect
      .element(screen.getByRole("button", { name: "Back" }))
      .toBeDisabled();

    await expect
      .element(screen.getByRole("button", { name: "Home" }))
      .toBeEnabled();
  });

  test("disables home button when canGoHome is false", async () => {
    const screen = await render(
      <NavButtons
        canGoBack={true}
        canGoHome={false}
        onBackClick={vi.fn()}
        onHomeClick={vi.fn()}
      />,
    );

    await expect
      .element(screen.getByRole("button", { name: "Home" }))
      .toBeDisabled();

    await expect
      .element(screen.getByRole("button", { name: "Back" }))
      .toBeEnabled();
  });

  test("disables both buttons when navigation is not available", async () => {
    const screen = await render(
      <NavButtons
        canGoBack={false}
        canGoHome={false}
        onBackClick={vi.fn()}
        onHomeClick={vi.fn()}
      />,
    );

    await expect
      .element(screen.getByRole("button", { name: "Back" }))
      .toBeDisabled();

    await expect
      .element(screen.getByRole("button", { name: "Home" }))
      .toBeDisabled();
  });
});
