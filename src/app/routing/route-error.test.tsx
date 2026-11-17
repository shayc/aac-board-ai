import { collectReportedErrors } from "@shared/testing/collect-reported-errors";
import { renderWithProviders } from "@shared/testing/render-with-providers";
import type { RouteObject } from "react-router";
import { RouterProvider } from "react-router/dom";
import { describe, expect, test } from "vitest";
import {
  reportRouteError,
  routeErrorCodes,
  routeErrorResponse,
} from "./route-error";
import { createErrorPageRouter } from "./testing/create-error-page-router";

function renderWithRoute(route: Pick<RouteObject, "loader" | "Component">) {
  const router = createErrorPageRouter(route);

  return renderWithProviders(
    <RouterProvider router={router} onError={reportRouteError} />,
  );
}

describe("reportRouteError", () => {
  test("reports an error a loader did not anticipate", async () => {
    const reportedErrors = collectReportedErrors();
    const loaderError = new Error("boom");

    const screen = await renderWithRoute({
      loader: () => {
        throw loaderError;
      },
    });

    await expect
      .element(screen.getByText("Couldn't load this page"))
      .toBeVisible();
    expect(reportedErrors).toEqual([loaderError]);
  });

  test("reports an error a route throws while rendering", async () => {
    const reportedErrors = collectReportedErrors();
    const renderError = new Error("boom");

    const screen = await renderWithRoute({
      Component: () => {
        throw renderError;
      },
    });

    await expect
      .element(screen.getByText("Couldn't load this page"))
      .toBeVisible();
    expect(reportedErrors).toEqual([renderError]);
  });

  test("does not report an error the page explains", async () => {
    const reportedErrors = collectReportedErrors();

    const screen = await renderWithRoute({
      loader: () => {
        throw routeErrorResponse(routeErrorCodes.boardNotFound);
      },
    });

    await expect.element(screen.getByText("Board not found")).toBeVisible();
    expect(reportedErrors).toEqual([]);
  });
});
