import { AppShell } from "@app/layouts/app-shell";
import { boardLoader } from "@app/loaders/board-loader";
import { boardSetIndexLoader } from "@app/loaders/board-set-index-loader";
import { rootIndexLoader } from "@app/loaders/root-index-loader";
import { RouteErrorBoundary } from "@app/route-error-boundary";
import { ROUTE_PATTERNS } from "@app/route-patterns";
import { BOARD_PATTERN, BOARD_SET_PATTERN } from "@features/board";
import { LoadingState } from "@shared/components/loading-state";
import { type RouteObject } from "react-router";

export const appRoutes: RouteObject[] = [
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
];
