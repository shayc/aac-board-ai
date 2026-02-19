import { AppShell } from "@app/layouts/AppShell";
import { BoardSetRootRedirect } from "@pages/BoardSetRootRedirect";
import { HomePage } from "@pages/HomePage";
import { AsyncBoundary } from "@shared/components/AsyncBoundary";
import { lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router";

export interface BoardRouteParams {
  [key: string]: string;
  setId: string;
  boardId: string;
}

const BoardPage = lazy(() => import("@pages/BoardPage"));
const LibraryPage = lazy(() => import("@pages/LibraryPage"));
const AboutPage = lazy(() => import("@pages/AboutPage"));

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="sets/:setId">
            <Route index element={<BoardSetRootRedirect />} />

            <Route
              path="boards/:boardId"
              element={
                <AsyncBoundary>
                  <BoardPage />
                </AsyncBoundary>
              }
            />
          </Route>

          <Route
            path="library"
            element={
              <AsyncBoundary>
                <LibraryPage />
              </AsyncBoundary>
            }
          />

          <Route
            path="about"
            element={
              <AsyncBoundary>
                <AboutPage />
              </AsyncBoundary>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
