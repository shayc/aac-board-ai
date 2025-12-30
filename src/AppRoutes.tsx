import { AppShell } from "@app/shell/AppShell";
import { BoardSetRootRedirect } from "@pages/BoardSetRootRedirect";
import { HomePage } from "@pages/HomePage";
import { LoadingIndicator } from "@shared/components/LoadingIndicator";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router";

const AboutPage = lazy(() =>
  import("@pages/AboutPage").then((module) => ({ default: module.AboutPage })),
);

const BoardPage = lazy(() =>
  import("@pages/BoardPage").then((module) => ({ default: module.BoardPage })),
);

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
                <Suspense fallback={<LoadingIndicator />}>
                  <BoardPage />
                </Suspense>
              }
            />
          </Route>
          <Route
            path="about"
            element={
              <Suspense fallback={<LoadingIndicator />}>
                <AboutPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
