import { AppProviders } from "@shared/providers/app-providers";
import { setStoredLanguage } from "@shared/language/language-store";
import { createMemoryRouter, data } from "react-router";
import { RouterProvider } from "react-router/dom";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { RouteErrorBoundary } from "./route-error-boundary";
import { createLocalizedRouteError, routeErrorCodes } from "./route-error";

function TestRoute() {
  return null;
}

function TestHydrateFallback() {
  return null;
}

function renderWithLoader(loader: () => unknown) {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        loader,
        Component: TestRoute,
        HydrateFallback: TestHydrateFallback,
        ErrorBoundary: RouteErrorBoundary,
      },
    ],
    { initialEntries: ["/"] },
  );

  return render(
    <AppProviders>
      <button onClick={() => setStoredLanguage("he")}>switch-to-hebrew</button>
      <RouterProvider router={router} />
    </AppProviders>,
  );
}

function throwDataResponse(errorData: unknown): never {
  // Mirrors the data() idiom used by real loaders (exempted from this
  // rule via their `*-loader.ts` filename, which this test file isn't).
  // eslint-disable-next-line @typescript-eslint/only-throw-error
  throw data(errorData, { status: 404 });
}

describe("RouteErrorBoundary", () => {
  test("shows the custom title for a data() response with a string message", async () => {
    const screen = await renderWithLoader(() =>
      throwDataResponse("Custom title"),
    );

    await expect.element(screen.getByText("Custom title")).toBeVisible();
  });

  test("shows the generic title for a plain error", async () => {
    const screen = await renderWithLoader(() => {
      throw new Error("boom");
    });

    await expect
      .element(screen.getByText("Something went wrong"))
      .toBeVisible();
  });

  test("links go home to the root route", async () => {
    const screen = await renderWithLoader(() => {
      throw new Error("boom");
    });

    await expect
      .element(screen.getByRole("link", { name: "Go home" }))
      .toHaveAttribute("href", "/");
  });

  test("retranslates a loader error that is already being displayed", async () => {
    const screen = await renderWithLoader(() =>
      throwDataResponse(
        createLocalizedRouteError(routeErrorCodes.boardNotFound),
      ),
    );

    await expect.element(screen.getByText("Board not found")).toBeVisible();

    await screen.getByRole("button", { name: "switch-to-hebrew" }).click();
    await expect.element(screen.getByText("הלוח לא נמצא")).toBeVisible();
  });

  test("distinguishes a missing board set from a missing board", async () => {
    const screen = await renderWithLoader(() =>
      throwDataResponse(
        createLocalizedRouteError(routeErrorCodes.boardSetNotFound),
      ),
    );

    await expect.element(screen.getByText("Board set not found")).toBeVisible();
    await expect
      .element(screen.getByText("Board not found"))
      .not.toBeInTheDocument();
  });
});
