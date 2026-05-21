import { AppShell } from "@app/layouts/app-shell";
import { boardSetRootLoader } from "@app/loaders/board-set-root-loader";
import { homeLoader } from "@app/loaders/home-loader";
import { boardLoader } from "@features/board";
import { ErrorState } from "@shared/components/error-state";
import { LoadingState } from "@shared/components/loading-state";
import {
  createBrowserRouter,
  isRouteErrorResponse,
  useRouteError,
} from "react-router";
import { RouterProvider } from "react-router/dom";

function RootErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    return (
      <ErrorState
        title={`${error.status} ${error.statusText}`}
        description={typeof error.data === "string" ? error.data : undefined}
      />
    );
  }
  return <ErrorState title="Something went wrong" />;
}

function BoardSetErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <ErrorState
        title="Board set not found"
        description="This board set may have been deleted."
      />
    );
  }
  if (isRouteErrorResponse(error) && error.status === 422) {
    return (
      <ErrorState
        title="Board set incomplete"
        description="This board set has no starting board."
      />
    );
  }
  return <ErrorState title="Something went wrong" />;
}

function BoardErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <ErrorState
        title="Board not found"
        description="This board may have been deleted or is missing assets."
      />
    );
  }
  return (
    <ErrorState
      title="Couldn't load board"
      description="Try returning to the library."
    />
  );
}

function PageHydrateFallback() {
  return <LoadingState />;
}

const router = createBrowserRouter([
  {
    Component: AppShell,
    ErrorBoundary: RootErrorBoundary,
    HydrateFallback: PageHydrateFallback,
    children: [
      { index: true, loader: homeLoader },
      {
        path: "sets/:setId",
        ErrorBoundary: BoardSetErrorBoundary,
        children: [
          { index: true, loader: boardSetRootLoader },
          {
            path: "boards/:boardId",
            loader: boardLoader,
            lazy: async () => import("@pages/board-page"),
            ErrorBoundary: BoardErrorBoundary,
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
