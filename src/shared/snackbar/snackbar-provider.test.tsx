import { m } from "@paraglide/messages.js";
import { setStoredLanguage } from "@shared/language/language-store";
import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { describe, expect, test, vi } from "vitest";
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

    // A clickaway-triggered close would unmount the message once its exit
    // transition ends, so prove it outlives that window: the disappearance
    // matcher must time out.
    await expect(
      expect
        .element(screen.getByRole("status"), { timeout: 500 })
        .not.toBeInTheDocument(),
    ).rejects.toThrow();

    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent("sticky");
  });

  test("announces errors assertively and other messages politely", async () => {
    const screen = await renderSnackbars({
      "show-saved": { message: "saved", severity: "success" },
      "show-failed": { message: "failed", severity: "error" },
    });

    await screen.getByRole("button", { name: "show-saved" }).click();
    await expect.element(screen.getByRole("status")).toHaveTextContent("saved");

    await screen.getByRole("button", { name: "show-failed" }).click();
    await expect.element(screen.getByRole("alert")).toHaveTextContent("failed");
  });

  test("hides a success message after its default duration", async () => {
    const screen = await renderSnackbars({
      "show-saved": { message: "saved", severity: "success" },
    });

    vi.useFakeTimers();
    await screen.getByRole("button", { name: "show-saved" }).click();
    await vi.advanceTimersByTimeAsync(60_000);
    vi.useRealTimers();

    await expect.element(screen.getByText("saved")).not.toBeInTheDocument();
  });

  test("keeps an error visible until it is dismissed", async () => {
    const screen = await renderSnackbars({
      "show-failed": { message: "failed", severity: "error" },
    });

    vi.useFakeTimers();
    await screen.getByRole("button", { name: "show-failed" }).click();
    await vi.advanceTimersByTimeAsync(60_000);
    vi.useRealTimers();

    await expect.element(screen.getByText("failed")).toBeInTheDocument();

    await screen.getByRole("button", { name: "Close" }).click();

    await expect.element(screen.getByText("failed")).not.toBeInTheDocument();
  });

  test("shows a plain-string message with no accessibility violations", async () => {
    const screen = await renderSnackbars({ "show-saved": "Saved" });

    await screen.getByRole("button", { name: "show-saved" }).click();
    await expect.element(screen.getByRole("status")).toHaveTextContent("Saved");

    // Axe computes color contrast against blended colors while the Grow
    // transition is still animating opacity, so wait for it to settle.
    await vi.waitFor(() => {
      const message = screen.getByRole("status").element();
      expect(getComputedStyle(message).opacity).toBe("1");
    });

    await expectNoA11yViolations(document.body);
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
