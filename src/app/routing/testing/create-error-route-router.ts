import { Fragment } from "react";
import { createMemoryRouter, type RouteObject } from "react-router";
import { RouteErrorBoundary } from "../route-error-boundary";

/** A one-route router whose loader or component error lands on the error page. */
export function createErrorRouteRouter({
  loader,
  Component = Fragment,
}: Pick<RouteObject, "loader" | "Component">) {
  return createMemoryRouter(
    [
      {
        path: "/",
        loader,
        Component,
        HydrateFallback: Fragment,
        ErrorBoundary: RouteErrorBoundary,
      },
    ],
    { initialEntries: ["/"] },
  );
}
