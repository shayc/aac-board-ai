import { AppShell } from "@app/layouts/app-shell";
import { boardLoader } from "@app/loaders/board-loader";
import { boardSetIndexLoader } from "@app/loaders/board-set-index-loader";
import { rootIndexLoader } from "@app/loaders/root-index-loader";
import { ROUTE_PATTERNS } from "@app/route-patterns";
import { BOARD_PATTERN, BOARD_SET_PATTERN } from "@features/board";
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
            path: BOARD_SET_PATTERN,
            children: [
              { index: true, loader: boardSetIndexLoader },
              {
                path: BOARD_PATTERN,
                loader: boardLoader,
                lazy: async () => import("@pages/board-page"),
              },
            ],
          },
          {
            path: ROUTE_PATTERNS.LIBRARY,
            lazy: async () => import("@pages/library-page"),
          },
          {
            path: ROUTE_PATTERNS.ABOUT,
            lazy: async () => import("@pages/about-page"),
          },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
