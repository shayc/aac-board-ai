import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { stubVoices } from "@shared/testing/stub-speech";
import { setTestViewport } from "@shared/testing/viewport";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
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

async function renderAppShellPastOnboarding() {
  const screen = await renderAppShell();

  await screen.getByRole("button", { name: "Continue" }).click();
  await expect
    .element(screen.getByRole("dialog", { name: "Welcome to AAC Board AI" }))
    .not.toBeInTheDocument();

  return screen;
}

describe("AppShell", () => {
  test("has no accessibility violations", async () => {
    await renderAppShell();

    await expectNoA11yViolations(document.body);
  });

  test("moves focus into the library on open and back on close on desktop", async () => {
    await setTestViewport(1200, 800);
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

  test("moves focus into the settings drawer on open and back on close", async () => {
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

  test("returns focus from the library to its opener on Escape", async () => {
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

  test("keeps the document language on the fallback locale for a language with voices but no UI text", async () => {
    stubVoices([{ voiceURI: "nb-1", name: "Nora", lang: "nb-NO" }]);
    const screen = await renderAppShellPastOnboarding();
    await screen.getByRole("button", { name: "Open settings" }).click();

    await screen.getByRole("combobox", { name: "Language" }).click();
    await screen.getByRole("option", { name: /norsk/i }).click();

    await expect
      .element(screen.getByRole("combobox", { name: "Voice" }))
      .toHaveTextContent("Nora");
    await expect
      .element(screen.getByRole("heading", { name: "Settings" }))
      .toBeVisible();
    expect(document.documentElement).toHaveAttribute("lang", "en");
  });
});
