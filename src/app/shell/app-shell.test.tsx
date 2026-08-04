import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
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
  test("has no a11y violations", async () => {
    await renderAppShell();

    await expectNoA11yViolations(document.body);
  });

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

  test("updates the mounted shell and open settings drawer across locale changes", async () => {
    const screen = await renderAppShell();

    await screen.getByRole("button", { name: "Continue" }).click();
    await expect
      .element(screen.getByRole("dialog", { name: "AAC Board AI" }))
      .not.toBeInTheDocument();

    const openSettings = screen.getByRole("button", {
      name: "Open settings",
    });
    const openSettingsButton = openSettings.element();
    await openSettings.click();

    await screen.getByRole("combobox", { name: "Language" }).click();
    await screen.getByRole("option", { name: "বাংলা" }).click();

    await expect
      .element(screen.getByRole("heading", { name: "সেটিংস" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("combobox", { name: "ভাষা" }))
      .toBeVisible();
    expect(openSettingsButton).toHaveAttribute("aria-label", "সেটিংস খুলুন");
    expect(document.documentElement).toHaveAttribute("lang", "bn");
    expect(document.documentElement).toHaveAttribute("dir", "ltr");

    await screen.getByRole("combobox", { name: "ভাষা" }).click();
    await screen.getByRole("option", { name: "עברית" }).click();

    await expect
      .element(screen.getByRole("heading", { name: "הגדרות" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("combobox", { name: "שפה" }))
      .toBeVisible();
    expect(openSettingsButton).toHaveAttribute("aria-label", "פתיחת הגדרות");
    expect(document.documentElement).toHaveAttribute("lang", "he");
    expect(document.documentElement).toHaveAttribute("dir", "rtl");
  });
});
