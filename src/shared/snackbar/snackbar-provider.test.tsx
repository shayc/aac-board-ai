import { m } from "@paraglide/messages.js";
import { setStoredLanguage } from "@shared/language/language-store";
import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { afterEach, describe, expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import type { SnackbarOptions } from "./snackbar-context";
import { useSnackbar } from "./use-snackbar";

const originalViewport = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// Keeps queued messages from auto-hiding mid-assertion on real timers.
const LONG_DURATION_MS = 60_000;

const TOAST_CLEARANCE_PX = 96;

type ShowRequest = SnackbarOptions | string;

function ShowButtons({
  snackbars,
}: {
  snackbars: Record<string, ShowRequest | ShowRequest[]>;
}) {
  const { showSnackbar } = useSnackbar();

  return (
    <div style={{ paddingTop: TOAST_CLEARANCE_PX }}>
      {Object.entries(snackbars).map(([name, requests]) => (
        <button
          key={name}
          onClick={() => [requests].flat().forEach(showSnackbar)}
        >
          {name}
        </button>
      ))}
      <button onClick={() => setStoredLanguage("he")}>switch-to-hebrew</button>
      <button>outside</button>
    </div>
  );
}

function renderSnackbars(
  snackbars: Record<string, ShowRequest | ShowRequest[]>,
) {
  return render(
    <AppProviders>
      <ShowButtons snackbars={snackbars} />
    </AppProviders>,
  );
}

async function showErrorAtViewportWidth(width: number) {
  await page.viewport(width, 800);
  const screen = await renderSnackbars({
    "show-failed": { message: "Failed", severity: "error" },
  });

  await screen.getByRole("button", { name: "show-failed" }).click();
  await vi.waitFor(() => {
    const alert = screen.getByRole("alert").element();
    expect(getComputedStyle(alert).opacity).toBe("1");
  });

  return screen.getByRole("alert").element().getBoundingClientRect();
}

describe("SnackbarProvider", () => {
  afterEach(async () => {
    vi.useRealTimers();
    await page.viewport(originalViewport.width, originalViewport.height);
  });

  test("auto-hides a success message after a few seconds", async () => {
    vi.useFakeTimers();
    const screen = await renderSnackbars({
      "show-saved": { message: "Saved", severity: "success" },
    });

    await screen.getByRole("button", { name: "show-saved" }).click();
    await expect.element(screen.getByRole("status")).toHaveTextContent("Saved");

    await vi.advanceTimersByTimeAsync(10_000);

    await expect.element(screen.getByRole("status")).not.toBeInTheDocument();
  });

  test.each([
    {
      name: "an error",
      role: "alert",
      options: { message: "Failed", severity: "error" },
    },
    {
      name: "a message with an action",
      role: "status",
      options: { message: "Failed", action: <button>Retry</button> },
    },
  ] satisfies {
    name: string;
    role: "alert" | "status";
    options: SnackbarOptions;
  }[])("keeps $name open until closed", async ({ role, options }) => {
    vi.useFakeTimers();
    const screen = await renderSnackbars({ "show-sticky": options });

    await screen.getByRole("button", { name: "show-sticky" }).click();
    await expect.element(screen.getByRole(role)).toMatchTextContent("Failed");

    await vi.advanceTimersByTimeAsync(10 * 60_000);
    await expect.element(screen.getByRole(role)).toMatchTextContent("Failed");

    await screen.getByRole("button", { name: "Close" }).click();
    await vi.advanceTimersByTimeAsync(1000);

    await expect.element(screen.getByRole(role)).not.toBeInTheDocument();
  });

  test("replaces an open error with a later message", async () => {
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

    await expect.element(screen.getByRole("status")).toHaveTextContent("Saved");
    await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
  });

  test("skips messages superseded while the current one closes", async () => {
    const screen = await renderSnackbars({
      "show-importing": { message: "Importing", durationMs: LONG_DURATION_MS },
      "show-outcomes": [
        { message: "Failed", severity: "error" },
        { message: "Saved", severity: "success", durationMs: LONG_DURATION_MS },
      ],
    });

    await screen.getByRole("button", { name: "show-importing" }).click();
    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent("Importing");

    await screen.getByRole("button", { name: "show-outcomes" }).click();

    await expect.element(screen.getByRole("status")).toHaveTextContent("Saved");
    await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
  });

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

    // A clickaway-triggered close would unmount the alert once its exit
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

  test("shows a plain-string message with no accessibility violations", async () => {
    const screen = await renderSnackbars({ "show-saved": "Saved" });

    await screen.getByRole("button", { name: "show-saved" }).click();
    await expect.element(screen.getByRole("status")).toHaveTextContent("Saved");

    // Axe computes color contrast against blended colors while the Grow
    // transition is still animating opacity, so wait for it to settle.
    await vi.waitFor(() => {
      const alert = screen.getByRole("status").element();
      expect(getComputedStyle(alert).opacity).toBe("1");
    });

    await expectNoA11yViolations(document.body);
  });

  test.each(["success", "info", "warning", "error"] as const)(
    "shows a %s message with no accessibility violations",
    async (severity) => {
      const role = severity === "error" ? "alert" : "status";
      const screen = await renderSnackbars({
        "show-status": {
          message: "Status",
          severity,
          durationMs: LONG_DURATION_MS,
        },
      });

      await screen.getByRole("button", { name: "show-status" }).click();
      await vi.waitFor(() => {
        const alert = screen.getByRole(role).element();
        expect(getComputedStyle(alert).opacity).toBe("1");
      });

      await expectNoA11yViolations(document.body);
    },
  );

  test.each([390, 1200])(
    "places the message 8px from the top at a viewport width of %i",
    async (width) => {
      const bounds = await showErrorAtViewportWidth(width);

      expect(bounds.top).toBe(8);
      expect(bounds.left + bounds.width / 2).toBe(window.innerWidth / 2);
    },
  );

  test("matches the phone app bar height with 16px side margins on small screens", async () => {
    const bounds = await showErrorAtViewportWidth(390);

    expect(bounds.height).toBe(56);
    expect(bounds.left).toBe(16);
    expect(window.innerWidth - bounds.right).toBe(16);
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
