import { AppShell } from "@app/layouts/app-shell";
import { boardLoader } from "@app/routing/loaders/board-loader";
import { boardSetIndexLoader } from "@app/routing/loaders/board-set-index-loader";
import { boardSetLoader } from "@app/routing/loaders/board-set-loader";
import { rootIndexLoader } from "@app/routing/loaders/root-index-loader";
import { NotFound } from "@app/routing/not-found";
import { RouteErrorBoundary } from "@app/routing/route-error-boundary";
import { BOARD_SEGMENT, BOARD_SET_SEGMENT } from "@features/board";
import { BoardPage } from "@pages/board-page";
import { LoadingState } from "@shared/components/loading-state";
import type { RouteObject } from "react-router";
import { BOARD_ROUTE_ID, BOARD_SET_ROUTE_ID } from "./route-ids";

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
            id: BOARD_SET_ROUTE_ID,
            path: BOARD_SET_SEGMENT,
            loader: boardSetLoader,
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
