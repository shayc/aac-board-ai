import { boardLoader } from "@app/routing/loaders/board-loader";
import { boardSetIndexLoader } from "@app/routing/loaders/board-set-index-loader";
import { rootIndexLoader } from "@app/routing/loaders/root-index-loader";
import { NotFound } from "@app/routing/not-found";
import { RouteErrorBoundary } from "@app/routing/route-error-boundary";
import { BOARD_ROUTE_ID } from "@app/routing/use-board-route-media-lifecycle";
import { AppShell } from "@app/shell/app-shell";
import { BOARD_SEGMENT, BOARD_SET_SEGMENT } from "@features/board";
import { BoardPage } from "@pages/board-page";
import { LoadingState } from "@shared/ui/loading-state";
import type { RouteObject } from "react-router";

export const appRoutes: RouteObject[] = [
  {
    Component: AppShell,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      {
        ErrorBoundary: RouteErrorBoundary,
        HydrateFallback: LoadingState,
        children: [
          {
            index: true,
            Component: LoadingState,
            loader: rootIndexLoader,
          },
          {
            path: BOARD_SET_SEGMENT,
            children: [
              { index: true, loader: boardSetIndexLoader },
              {
                id: BOARD_ROUTE_ID,
                path: BOARD_SEGMENT,
                loader: boardLoader,
                Component: BoardPage,
              },
            ],
          },
          { path: "*", Component: NotFound },
        ],
      },
    ],
  },
];
