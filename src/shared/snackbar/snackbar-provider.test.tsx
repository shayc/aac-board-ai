import { m } from "@paraglide/messages.js";
import { setStoredLanguage } from "@shared/language/language-store";
import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { SnackbarOptions } from "./snackbar-context";
import { useSnackbar } from "./use-snackbar";

// Keeps queued messages from auto-hiding mid-assertion on real timers.
const LONG_DURATION_MS = 60_000;

type SnackbarInput = SnackbarOptions | string;

// A list raises all of its messages from one click.
type ShowButtonSnackbars = Record<string, SnackbarInput | SnackbarInput[]>;

function ShowButtons({ snackbars }: { snackbars: ShowButtonSnackbars }) {
  const { showSnackbar } = useSnackbar();

  function showAll(inputs: SnackbarInput | SnackbarInput[]) {
    for (const input of [inputs].flat()) {
      showSnackbar(input);
    }
  }

  return (
    <>
      {Object.entries(snackbars).map(([name, inputs]) => (
        <button key={name} onClick={() => showAll(inputs)}>
          {name}
        </button>
      ))}
      <button onClick={() => setStoredLanguage("he")}>switch-to-hebrew</button>
      <button>outside</button>
    </>
  );
}

function renderSnackbars(snackbars: ShowButtonSnackbars) {
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

  test("keeps showing messages after two are raised by the same action", async () => {
    const screen = await renderSnackbars({
      "show-both": [
        { message: "first", durationMs: LONG_DURATION_MS },
        { message: "second", durationMs: LONG_DURATION_MS },
      ],
      "show-third": { message: "third", durationMs: LONG_DURATION_MS },
    });

    await screen.getByRole("button", { name: "show-both" }).click();
    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent("second");

    await screen.getByRole("button", { name: "show-third" }).click();
    await expect.element(screen.getByRole("status")).toHaveTextContent("third");
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

  test("keeps a waiting message on screen until it is closed, then shows the next", async () => {
    const screen = await renderSnackbars({
      "show-three": [
        { message: "first", durationMs: LONG_DURATION_MS },
        { message: "second", durationMs: LONG_DURATION_MS },
        { message: "third", durationMs: LONG_DURATION_MS },
      ],
    });

    await screen.getByRole("button", { name: "show-three" }).click();

    // A message closed as it opens fades out before it ever settles, so a
    // settled second message is one that is staying.
    await vi.waitFor(() => {
      const status = screen.getByRole("status").element();
      expect(status.textContent).toContain("second");
      expect(getComputedStyle(status).opacity).toBe("1");
    });

    await screen.getByRole("button", { name: "Close" }).click();

    await expect.element(screen.getByRole("status")).toHaveTextContent("third");
  });

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
