import { AppShell } from "@app/shell/app-shell";
import { BOARD_SEGMENT, BOARD_SET_SEGMENT } from "@features/library";
import { LoadingState } from "@shared/ui/loading-state";
import type { RouteObject } from "react-router";
import { boardLoader } from "./board-set/board-loader";
import { BoardPage } from "./board-set/board-page";
import { boardSetIndexLoader } from "./board-set/board-set-index-loader";
import {
  BOARD_SET_ROUTE_ID,
  boardSetLoader,
} from "./board-set/board-set-loader";
import { NotFound } from "./not-found";
import { BoardLinkImportPage } from "./root/board-link-import-page";
import { rootIndexAction } from "./root/root-index-action";
import { rootIndexLoader } from "./root/root-index-loader";
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
            Component: BoardLinkImportPage,
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
