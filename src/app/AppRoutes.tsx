import { AppShell } from "@app/shell/AppShell";
import { BoardSetRootRedirect } from "@pages/BoardSetRootRedirect";
import { HomePage } from "@pages/HomePage";
import { ErrorFallback } from "@shared/components/ErrorFallback";
import { LoadingIndicator } from "@shared/components/LoadingIndicator";
import { lazy, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { BrowserRouter, Route, Routes } from "react-router";

const AboutPage = lazy(() => import("@pages/AboutPage"));
const BoardPage = lazy(() => import("@pages/BoardPage"));

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
                <ErrorBoundary fallback={<ErrorFallback />}>
                  <Suspense fallback={<LoadingIndicator />}>
                    <BoardPage />
                  </Suspense>
                </ErrorBoundary>
              }
            />
          </Route>
          <Route
            path="about"
            element={
              <ErrorBoundary fallback={<ErrorFallback />}>
                <Suspense fallback={<LoadingIndicator />}>
                  <AboutPage />
                </Suspense>
              </ErrorBoundary>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
