import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import type { SnackbarOptions } from "./snackbar-context";
import { useSnackbar } from "./use-snackbar";

// Keeps queued messages from auto-hiding mid-assertion on real timers.
const LONG_DURATION = 60_000;

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
  test("shows a message from the string overload", async () => {
    const screen = await renderSnackbars({ "show-saved": "Saved" });

    await screen.getByRole("button", { name: "show-saved" }).click();

    await expect.element(screen.getByRole("alert")).toHaveTextContent("Saved");
  });

  test("queues a second message until the first is dismissed", async () => {
    const screen = await renderSnackbars({
      "show-first": { message: "first", duration: LONG_DURATION },
      "show-second": { message: "second", duration: LONG_DURATION },
    });

    await screen.getByRole("button", { name: "show-first" }).click();
    await screen.getByRole("button", { name: "show-second" }).click();

    await expect.element(screen.getByRole("alert")).toHaveTextContent("first");

    await screen.getByRole("button", { name: "Close" }).click();

    await expect.element(screen.getByRole("alert")).toHaveTextContent("second");
  });

  test("ignores clickaway so the message stays visible", async () => {
    const screen = await renderSnackbars({
      "show-sticky": { message: "sticky", duration: LONG_DURATION },
      "show-queued": { message: "queued", duration: LONG_DURATION },
    });

    await screen.getByRole("button", { name: "show-sticky" }).click();
    await expect.element(screen.getByRole("alert")).toHaveTextContent("sticky");
    await screen.getByRole("button", { name: "show-queued" }).click();

    await screen.getByRole("button", { name: "outside" }).click();

    // Had clickaway dismissed "sticky", "queued" would already be promoted
    // and the explicit close below would dismiss the wrong message.
    await expect.element(screen.getByRole("alert")).toHaveTextContent("sticky");
    await screen.getByRole("button", { name: "Close" }).click();
    await expect.element(screen.getByRole("alert")).toHaveTextContent("queued");
  });

  test("has no a11y violations with an open snackbar", async () => {
    const screen = await renderSnackbars({
      "show-message": { message: "Saved", duration: LONG_DURATION },
    });

    await screen.getByRole("button", { name: "show-message" }).click();
    await expect.element(screen.getByRole("alert")).toBeVisible();

    await expectNoA11yViolations(document.body);
  });
});
