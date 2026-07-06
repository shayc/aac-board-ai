import { AppShell } from "@app/layouts/app-shell";
import { boardLoader } from "@app/routing/loaders/board-loader";
import { boardSetIndexLoader } from "@app/routing/loaders/board-set-index-loader";
import { rootIndexLoader } from "@app/routing/loaders/root-index-loader";
import { RouteErrorBoundary } from "@app/routing/route-error-boundary";
import { BOARD_SEGMENT, BOARD_SET_SEGMENT } from "@features/board";
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
          {
            index: true,
            loader: rootIndexLoader,
            lazy: () => import("@pages/board-url-import-page"),
          },
          {
            path: BOARD_SET_SEGMENT,
            children: [
              { index: true, loader: boardSetIndexLoader },
              {
                path: BOARD_SEGMENT,
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
