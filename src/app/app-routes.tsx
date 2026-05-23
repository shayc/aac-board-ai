import { AppShell } from "@app/layouts/app-shell";
import { boardLoader } from "@app/loaders/board-loader";
import { boardSetIndexLoader } from "@app/loaders/board-set-index-loader";
import { rootIndexLoader } from "@app/loaders/root-index-loader";
import Button from "@mui/material/Button";
import { m } from "@paraglide/messages.js";
import { ErrorState } from "@shared/components/error-state";
import { LoadingState } from "@shared/components/loading-state";
import { useLanguage } from "@shared/language/use-language";
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
            path: "sets/:setId",
            children: [
              { index: true, loader: boardSetIndexLoader },
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
    ],
  },
]);

export function AppRoutes() {
  const { language } = useLanguage();

  // Remount on language change so `m.foo()` calls below re-evaluate.
  return <RouterProvider key={language} router={router} />;
}
