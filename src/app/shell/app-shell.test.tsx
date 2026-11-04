import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { AppShell } from "./app-shell";

const originalViewport = {
  width: window.innerWidth,
  height: window.innerHeight,
};

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

async function renderAppShellPastOnboarding() {
  const screen = await renderAppShell();

  await screen.getByRole("button", { name: "Continue" }).click();
  await expect
    .element(screen.getByRole("dialog", { name: "Welcome to AAC Board AI" }))
    .not.toBeInTheDocument();

  return screen;
}

describe("AppShell", () => {
  afterEach(async () => {
    await page.viewport(originalViewport.width, originalViewport.height);
  });

  test("has no a11y violations", async () => {
    await renderAppShell();

    await expectNoA11yViolations(document.body);
  });

  test("library takes focus on open and returns it on close on desktop", async () => {
    await page.viewport(1200, 800);
    const screen = await renderAppShellPastOnboarding();

    await screen.getByRole("button", { name: "Open library" }).click();

    await expect
      .element(screen.getByRole("dialog", { name: "Library" }))
      .toHaveFocus();

    await screen.getByRole("button", { name: "Close library" }).click();

    await expect
      .element(screen.getByRole("button", { name: "Open library" }))
      .toHaveFocus();
  });

  test("settings drawer takes focus on open and returns it on close", async () => {
    const screen = await renderAppShellPastOnboarding();

    await screen.getByRole("button", { name: "Open settings" }).click();

    await expect
      .element(screen.getByRole("dialog", { name: "Settings" }))
      .toHaveFocus();

    await screen.getByRole("button", { name: "Close settings" }).click();

    await expect
      .element(screen.getByRole("button", { name: "Open settings" }))
      .toHaveFocus();
  });

  test("library returns focus to its opener on Escape", async () => {
    const screen = await renderAppShellPastOnboarding();
    const openButton = screen.getByRole("button", { name: "Open library" });

    await openButton.click();
    await expect
      .element(screen.getByRole("dialog", { name: "Library" }))
      .toBeVisible();

    await userEvent.keyboard("{Escape}");

    await expect.element(openButton).toHaveFocus();
  });

  test("updates the mounted shell and open settings drawer across locale changes", async () => {
    const screen = await renderAppShellPastOnboarding();
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
    expect(openSettingsButton).toHaveAttribute("aria-label", "פתיחת ההגדרות");
    expect(document.documentElement).toHaveAttribute("lang", "he");
    expect(document.documentElement).toHaveAttribute("dir", "rtl");
  });
});
