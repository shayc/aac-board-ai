import { AppShell } from "@app/layouts/app-shell";
import { BoardSetRootRedirect } from "@pages/board-set-root-redirect";
import { HomePage } from "@pages/home-page";
import { AsyncBoundary } from "@shared/components/async-boundary";
import { lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router";

const BoardPage = lazy(() => import("@pages/board-page"));
const LibraryPage = lazy(() => import("@pages/library/library-page"));
const AboutPage = lazy(() => import("@pages/about-page"));

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
