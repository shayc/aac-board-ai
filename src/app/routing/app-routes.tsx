import { AppShell } from "@app/layouts/app-shell";
import { boardLoader } from "@app/routing/loaders/board-loader";
import { boardSetIndexLoader } from "@app/routing/loaders/board-set-index-loader";
import { rootIndexLoader } from "@app/routing/loaders/root-index-loader";
import { RouteErrorBoundary } from "@app/routing/route-error-boundary";
import { BOARD_PATTERN, BOARD_SET_PATTERN } from "@features/board";
import { LoadingState } from "@shared/components/loading-state";
import type { RouteObject } from "react-router";

export const appRoutes: RouteObject[] = [
  {
    Component: AppShell,
    children: [
      {
        ErrorBoundary: RouteErrorBoundary,
        HydrateFallback: LoadingState,
        children: [
          { index: true, loader: rootIndexLoader },
          {
            path: BOARD_SET_PATTERN,
            children: [
              { index: true, loader: boardSetIndexLoader },
              {
                path: BOARD_PATTERN,
                loader: boardLoader,
                lazy: () => import("@pages/board-page"),
              },
            ],
          },
        ],
      },
    ],
  },
];
