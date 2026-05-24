import { AppShell } from "@app/layouts/app-shell";
import { boardLoader } from "@app/loaders/board-loader";
import { boardSetIndexLoader } from "@app/loaders/board-set-index-loader";
import { rootIndexLoader } from "@app/loaders/root-index-loader";
import { ROUTE_PATTERNS } from "@app/routes";
import Button from "@mui/material/Button";
import { m } from "@paraglide/messages.js";
import { ErrorState } from "@shared/components/error-state";
import { LoadingState } from "@shared/components/loading-state";
import {
  createBrowserRouter,
  isRouteErrorResponse,
  Link,
  useRouteError,
} from "react-router";
import { RouterProvider } from "react-router/dom";

function RouteErrorBoundary() {
  const error = useRouteError();
  const title =
    isRouteErrorResponse(error) && typeof error.data === "string"
      ? error.data
      : m.errorGenericTitle();

  return (
    <ErrorState
      title={title}
      action={
        <Button component={Link} to="/" variant="contained">
          {m.errorGoHome()}
        </Button>
      }
    />
  );
}

const router = createBrowserRouter([
  {
    Component: AppShell,
    HydrateFallback: LoadingState,
    children: [
      {
        ErrorBoundary: RouteErrorBoundary,
        children: [
          { index: true, loader: rootIndexLoader },
          {
            path: ROUTE_PATTERNS.BOARD_SET,
            children: [
              { index: true, loader: boardSetIndexLoader },
              {
                path: ROUTE_PATTERNS.BOARDS,
                loader: boardLoader,
                lazy: async () => import("@pages/board-page"),
              },
            ],
          },
          { path: "library", lazy: async () => import("@pages/library-page") },
          { path: "about", lazy: async () => import("@pages/about-page") },
        ],
      },
    ],
  },
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}
