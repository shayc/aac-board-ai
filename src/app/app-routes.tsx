import { AppShell } from "@app/layouts/app-shell";
import { boardSetRootLoader } from "@app/loaders/board-set-root-loader";
import { homeLoader } from "@app/loaders/home-loader";
import { boardLoader } from "@features/board";
import Button from "@mui/material/Button";
import { ErrorState } from "@shared/components/error-state";
import { LoadingState } from "@shared/components/loading-state";
import { createBrowserRouter, Link } from "react-router";
import { RouterProvider } from "react-router/dom";

function RouteErrorBoundary() {
  return (
    <ErrorState
      title="Something went wrong"
      action={
        <Button component={Link} to="/" variant="contained">
          Go home
        </Button>
      }
    />
  );
}

const router = createBrowserRouter([
  {
    Component: AppShell,
    ErrorBoundary: RouteErrorBoundary,
    HydrateFallback: LoadingState,
    children: [
      { index: true, loader: homeLoader },
      {
        path: "sets/:setId",
        children: [
          { index: true, loader: boardSetRootLoader },
          {
            path: "boards/:boardId",
            loader: boardLoader,
            lazy: async () => import("@pages/board-page"),
          },
        ],
      },
      { path: "library", lazy: async () => import("@pages/library-page") },
      { path: "about", lazy: async () => import("@pages/about-page") },
    ],
  },
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}
