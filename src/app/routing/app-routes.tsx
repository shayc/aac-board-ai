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
import { NotFound } from "./errors/not-found";
import { RouteErrorBoundary } from "./errors/route-error-boundary";
import { BoardFileURLImportPage } from "./root/board-file-url-import-page";
import { rootIndexAction, rootIndexLoader } from "./root/root-index-route";

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
            Component: BoardFileURLImportPage,
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
