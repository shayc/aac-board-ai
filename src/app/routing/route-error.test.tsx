import { collectReportedErrors } from "@shared/testing/collect-reported-errors";
import { renderWithProviders } from "@shared/testing/render-with-providers";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { describe, expect, test } from "vitest";
import {
  reportRouteError,
  routeErrorCodes,
  routeErrorResponse,
} from "./route-error";
import { RouteErrorBoundary } from "./route-error-boundary";

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

  return renderWithProviders(
    <RouterProvider router={router} onError={reportRouteError} />,
  );
}

describe("reportRouteError", () => {
  test("reports an error a loader did not anticipate", async () => {
    const reportedErrors = collectReportedErrors();
    const loaderError = new Error("boom");

    const screen = await renderWithLoader(() => {
      throw loaderError;
    });

    await expect
      .element(screen.getByText("Couldn't load this page"))
      .toBeVisible();
    expect(reportedErrors).toEqual([loaderError]);
  });

  test("does not report an error the page explains", async () => {
    const reportedErrors = collectReportedErrors();

    const screen = await renderWithLoader(() => {
      throw routeErrorResponse(routeErrorCodes.boardNotFound);
    });

    await expect.element(screen.getByText("Board not found")).toBeVisible();
    expect(reportedErrors).toEqual([]);
  });
});
