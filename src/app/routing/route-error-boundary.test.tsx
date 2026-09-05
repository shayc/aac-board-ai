import { AppProviders } from "@shared/providers/app-providers";
import { setStoredLanguage } from "@shared/language/language-store";
import { createMemoryRouter, data } from "react-router";
import { RouterProvider } from "react-router/dom";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { RouteErrorBoundary } from "./route-error-boundary";
import { createRouteErrorPayload, routeErrorCodes } from "./route-error";

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
  // React Router exposes data responses by throwing them from loaders.
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
      throwDataResponse(createRouteErrorPayload(routeErrorCodes.boardNotFound)),
    );

    await expect.element(screen.getByText("Board not found")).toBeVisible();
    expect(document.title).toBe("Board not found");

    await screen.getByRole("button", { name: "switch-to-hebrew" }).click();
    await expect.element(screen.getByText("הלוח לא נמצא")).toBeVisible();
    await vi.waitFor(() => expect(document.title).toBe("הלוח לא נמצא"));
  });

  test("distinguishes a missing board set from a missing board", async () => {
    const screen = await renderWithLoader(() =>
      throwDataResponse(
        createRouteErrorPayload(routeErrorCodes.boardSetNotFound),
      ),
    );

    await expect.element(screen.getByText("Board set not found")).toBeVisible();
    await expect
      .element(screen.getByText("Board not found"))
      .not.toBeInTheDocument();
  });
});
