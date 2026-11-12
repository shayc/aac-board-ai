import { m } from "@paraglide/messages.js";
import { setStoredLanguage } from "@shared/language/language-store";
import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { setTestViewport } from "@shared/testing/viewport";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { SnackbarOptions } from "./snackbar-context";
import { useSnackbar } from "./use-snackbar";

const LONG_DURATION_MS = 60_000;

function ShowButtons({
  snackbars,
}: {
  snackbars: Record<string, SnackbarOptions | string>;
}) {
  const { showSnackbar } = useSnackbar();

  // Pinned to the bottom so a visible snackbar never covers the buttons.
  return (
    <div style={{ position: "fixed", bottom: 0 }}>
      {Object.entries(snackbars).map(([name, options]) => (
        <button key={name} onClick={() => showSnackbar(options)}>
          {name}
        </button>
      ))}
      <button onClick={() => setStoredLanguage("he")}>switch-to-hebrew</button>
      <button>outside</button>
    </div>
  );
}

function renderSnackbars(snackbars: Record<string, SnackbarOptions | string>) {
  return render(
    <AppProviders>
      <ShowButtons snackbars={snackbars} />
    </AppProviders>,
  );
}

describe("SnackbarProvider", () => {
  test("replaces the current message with a new one after its exit transition", async () => {
    const screen = await renderSnackbars({
      "show-first": { message: "first", durationMs: LONG_DURATION_MS },
      "show-second": { message: "second", durationMs: LONG_DURATION_MS },
    });

    await screen.getByRole("button", { name: "show-first" }).click();
    await expect.element(screen.getByRole("status")).toHaveTextContent("first");

    await screen.getByRole("button", { name: "show-second" }).click();

    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent("second");
  });

  test("ignores clickaway so the message stays visible", async () => {
    const screen = await renderSnackbars({
      "show-sticky": { message: "sticky", durationMs: LONG_DURATION_MS },
    });

    await screen.getByRole("button", { name: "show-sticky" }).click();
    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent("sticky");

    await screen.getByRole("button", { name: "outside" }).click();

    // Observe past the exit transition to catch a delayed clickaway dismissal.
    await expect(
      expect
        .element(screen.getByRole("status"), { timeout: 500 })
        .not.toBeInTheDocument(),
    ).rejects.toThrow();

    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent("sticky");
  });

  test("shows a plain-string message with no accessibility violations", async () => {
    const screen = await renderSnackbars({ "show-saved": "Saved" });

    await screen.getByRole("button", { name: "show-saved" }).click();
    await expect.element(screen.getByRole("status")).toHaveTextContent("Saved");

    // Axe needs the final opacity for color-contrast checks.
    await vi.waitFor(() => {
      const alert = screen.getByRole("status").element();
      expect(getComputedStyle(alert).opacity).toBe("1");
    });

    await expectNoA11yViolations(document.body);
  });

  test("announces errors assertively and other messages politely", async () => {
    const screen = await renderSnackbars({
      "show-error": { message: "failed", severity: "error" },
      "show-success": {
        message: "done",
        severity: "success",
        durationMs: LONG_DURATION_MS,
      },
    });

    await screen.getByRole("button", { name: "show-error" }).click();
    await expect.element(screen.getByRole("alert")).toHaveTextContent("failed");

    await screen.getByRole("button", { name: "show-success" }).click();
    await expect.element(screen.getByRole("status")).toHaveTextContent("done");
  });

  test.each([375, 1024])(
    "keeps a persistent error at the top, clear of controls along the bottom, at a viewport width of %i",
    async (width) => {
      await setTestViewport(width, 667);
      const screen = await renderSnackbars({
        "show-error": { message: "failed", severity: "error" },
      });

      await screen.getByRole("button", { name: "show-error" }).click();
      const alert = screen.getByRole("alert");
      await expect.element(alert).toBeVisible();

      const bounds = alert.element().getBoundingClientRect();
      expect(bounds.bottom).toBeLessThan(window.innerHeight / 2);
    },
  );

  describe("default duration", () => {
    const PAST_DEFAULT_DURATION_MS = 10_000;

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.clearAllTimers();
      vi.useRealTimers();
    });

    test("hides an informational message on its own", async () => {
      const screen = await renderSnackbars({ "show-saved": "Saved" });

      await screen.getByRole("button", { name: "show-saved" }).click();
      await expect
        .element(screen.getByRole("status"))
        .toHaveTextContent("Saved");

      await vi.advanceTimersByTimeAsync(PAST_DEFAULT_DURATION_MS);

      await expect.element(screen.getByRole("status")).not.toBeInTheDocument();
    });

    test("keeps an error visible until it is closed", async () => {
      const screen = await renderSnackbars({
        "show-error": { message: "failed", severity: "error" },
      });

      await screen.getByRole("button", { name: "show-error" }).click();
      await expect
        .element(screen.getByRole("alert"))
        .toHaveTextContent("failed");

      await vi.advanceTimersByTimeAsync(PAST_DEFAULT_DURATION_MS);

      await expect.element(screen.getByRole("alert")).toBeVisible();

      await screen.getByRole("button", { name: "Close" }).click();
      await vi.advanceTimersByTimeAsync(PAST_DEFAULT_DURATION_MS);

      await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
    });
  });

  test("retranslates a visible localized message when the locale changes", async () => {
    const screen = await renderSnackbars({
      "show-imported": {
        message: (t) => t(m.libraryImportedBoardSets, { count: 1 }),
        durationMs: LONG_DURATION_MS,
      },
    });

    await screen.getByRole("button", { name: "show-imported" }).click();
    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent("Board set imported");
    await expect
      .element(screen.getByRole("button", { name: "Close" }))
      .toBeVisible();

    await screen.getByRole("button", { name: "switch-to-hebrew" }).click();
    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent("ערכת הלוחות יובאה בהצלחה");
    await expect
      .element(screen.getByRole("button", { name: "סגירה" }))
      .toBeVisible();
  });
});
