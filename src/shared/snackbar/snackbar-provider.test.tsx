import { m } from "@paraglide/messages.js";
import { setStoredLanguage } from "@shared/language/language-store";
import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { afterEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { SnackbarOptions } from "./snackbar-context";
import { useSnackbar } from "./use-snackbar";

// Keeps queued messages from auto-hiding mid-assertion on real timers.
const LONG_DURATION_MS = 60_000;

function ShowButtons({
  snackbars,
}: {
  snackbars: Record<string, SnackbarOptions | string>;
}) {
  const { showSnackbar } = useSnackbar();

  return (
    <>
      {Object.entries(snackbars).map(([name, options]) => (
        <button key={name} onClick={() => showSnackbar(options)}>
          {name}
        </button>
      ))}
      <button onClick={() => setStoredLanguage("he")}>switch-to-hebrew</button>
      <button>outside</button>
    </>
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
  afterEach(() => {
    vi.useRealTimers();
  });

  test("auto-hides a success message after a few seconds", async () => {
    vi.useFakeTimers();
    const screen = await renderSnackbars({
      "show-saved": { message: "Saved", severity: "success" },
    });

    await screen.getByRole("button", { name: "show-saved" }).click();
    await expect.element(screen.getByRole("alert")).toHaveTextContent("Saved");

    await vi.advanceTimersByTimeAsync(10_000);

    await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
  });

  test.each([
    { name: "an error", options: { message: "Failed", severity: "error" } },
    {
      name: "a message with an action",
      options: { message: "Failed", action: <button>Retry</button> },
    },
  ] satisfies { name: string; options: SnackbarOptions }[])(
    "keeps $name open until closed",
    async ({ options }) => {
      vi.useFakeTimers();
      const screen = await renderSnackbars({ "show-sticky": options });

      await screen.getByRole("button", { name: "show-sticky" }).click();
      await expect
        .element(screen.getByRole("alert"))
        .toMatchTextContent("Failed");

      await vi.advanceTimersByTimeAsync(10 * 60_000);
      await expect
        .element(screen.getByRole("alert"))
        .toMatchTextContent("Failed");

      await screen.getByRole("button", { name: "Close" }).click();
      await vi.advanceTimersByTimeAsync(1000);

      await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
    },
  );

  test("shows a later message only after an error is closed", async () => {
    const screen = await renderSnackbars({
      "show-error": { message: "Failed", severity: "error" },
      "show-saved": {
        message: "Saved",
        severity: "success",
        durationMs: LONG_DURATION_MS,
      },
    });

    await screen.getByRole("button", { name: "show-error" }).click();
    await expect.element(screen.getByRole("alert")).toHaveTextContent("Failed");

    await screen.getByRole("button", { name: "show-saved" }).click();
    await expect.element(screen.getByRole("alert")).toHaveTextContent("Failed");

    await screen.getByRole("button", { name: "Close" }).click();

    await expect.element(screen.getByRole("alert")).toHaveTextContent("Saved");
  });

  test("replaces the current message with a new one after its exit transition", async () => {
    const screen = await renderSnackbars({
      "show-first": { message: "first", durationMs: LONG_DURATION_MS },
      "show-second": { message: "second", durationMs: LONG_DURATION_MS },
    });

    await screen.getByRole("button", { name: "show-first" }).click();
    await expect.element(screen.getByRole("alert")).toHaveTextContent("first");

    await screen.getByRole("button", { name: "show-second" }).click();

    await expect.element(screen.getByRole("alert")).toHaveTextContent("second");
  });

  test("ignores clickaway so the message stays visible", async () => {
    const screen = await renderSnackbars({
      "show-sticky": { message: "sticky", durationMs: LONG_DURATION_MS },
    });

    await screen.getByRole("button", { name: "show-sticky" }).click();
    await expect.element(screen.getByRole("alert")).toHaveTextContent("sticky");

    await screen.getByRole("button", { name: "outside" }).click();

    // A clickaway-triggered close would unmount the alert once its exit
    // transition ends, so prove it outlives that window: the disappearance
    // matcher must time out.
    await expect(
      expect
        .element(screen.getByRole("alert"), { timeout: 500 })
        .not.toBeInTheDocument(),
    ).rejects.toThrow();

    await expect.element(screen.getByRole("alert")).toHaveTextContent("sticky");
  });

  test("shows a plain-string message with no accessibility violations", async () => {
    const screen = await renderSnackbars({ "show-saved": "Saved" });

    await screen.getByRole("button", { name: "show-saved" }).click();
    await expect.element(screen.getByRole("alert")).toHaveTextContent("Saved");

    // Axe computes color contrast against blended colors while the Grow
    // transition is still animating opacity, so wait for it to settle.
    await vi.waitFor(() => {
      const alert = screen.getByRole("alert").element();
      expect(getComputedStyle(alert).opacity).toBe("1");
    });

    await expectNoA11yViolations(document.body);
  });

  test.each(["success", "info", "warning", "error"] as const)(
    "shows a %s message with no accessibility violations",
    async (severity) => {
      const screen = await renderSnackbars({
        "show-status": {
          message: "Status",
          severity,
          durationMs: LONG_DURATION_MS,
        },
      });

      await screen.getByRole("button", { name: "show-status" }).click();
      await vi.waitFor(() => {
        const alert = screen.getByRole("alert").element();
        expect(getComputedStyle(alert).opacity).toBe("1");
      });

      await expectNoA11yViolations(document.body);
    },
  );

  test("retranslates a visible localized message when the locale changes", async () => {
    const screen = await renderSnackbars({
      "show-imported": {
        message: (t) => t(m.libraryImportedBoardSets, { count: 1 }),
        durationMs: LONG_DURATION_MS,
      },
    });

    await screen.getByRole("button", { name: "show-imported" }).click();
    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("Board set imported");
    await expect
      .element(screen.getByRole("button", { name: "Close" }))
      .toBeVisible();

    await screen.getByRole("button", { name: "switch-to-hebrew" }).click();
    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("ערכת הלוחות יובאה בהצלחה");
    await expect
      .element(screen.getByRole("button", { name: "סגירה" }))
      .toBeVisible();
  });
});
