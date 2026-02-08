import { AppShell } from "@app/layouts/AppShell";
import { BoardSetRootRedirect } from "@pages/BoardSetRootRedirect";
import { HomePage } from "@pages/HomePage";
import { ErrorFallback } from "@shared/components/ErrorFallback";
import { LoadingIndicator } from "@shared/components/LoadingIndicator";
import { lazy, type ReactNode, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { BrowserRouter, Route, Routes } from "react-router";

const BoardPage = lazy(() => import("@pages/BoardPage"));
const AboutPage = lazy(() => import("@pages/AboutPage"));

function AsyncBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <Suspense fallback={<LoadingIndicator />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

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
