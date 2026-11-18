import { Fragment } from "react";
import { createMemoryRouter, type RouteObject } from "react-router";
import { RouteErrorBoundary } from "../route-error-boundary";

export function createErrorPageRouter({
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
