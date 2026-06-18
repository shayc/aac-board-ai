import { AppProviders } from "@shared/providers/app-providers";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { AppShell } from "./app-shell";

function renderAppShell() {
  const router = createMemoryRouter([
    {
      element: <AppShell />,
      children: [{ path: "/", element: <p>page content</p> }],
    },
  ]);

  return render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
}

describe("AppShell", () => {
  test("onboarding shows on first visit and closes on Continue", async () => {
    const screen = await renderAppShell();

    await expect
      .element(screen.getByRole("dialog", { name: "AAC Board AI" }))
      .toBeVisible();

    await screen.getByRole("button", { name: "Continue" }).click();

    await expect
      .element(screen.getByRole("dialog", { name: "AAC Board AI" }))
      .not.toBeInTheDocument();
  });
});
