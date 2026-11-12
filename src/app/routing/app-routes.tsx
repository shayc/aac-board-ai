import { AppShell } from "@app/shell/app-shell";
import { BOARD_SEGMENT, BOARD_SET_SEGMENT } from "@features/library";
import { LoadingState } from "@shared/ui/loading-state";
import type { RouteObject } from "react-router";
import { rootIndexAction } from "./actions/root-index-action";
import { BoardLinkPage } from "./board-link-page";
import { BoardPage } from "./board-page";
import { boardLoader } from "./loaders/board-loader";
import { boardSetIndexLoader } from "./loaders/board-set-index-loader";
import { BOARD_SET_ROUTE_ID, boardSetLoader } from "./loaders/board-set-loader";
import { rootIndexLoader } from "./loaders/root-index-loader";
import { NotFound } from "./not-found";
import { RouteErrorBoundary } from "./route-error-boundary";

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
            Component: BoardLinkPage,
            loader: rootIndexLoader,
            action: rootIndexAction,
          },
          {
            id: BOARD_SET_ROUTE_ID,
            path: BOARD_SET_SEGMENT,
            loader: boardSetLoader,
            children: [
              { index: true, loader: boardSetIndexLoader },
              {
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
