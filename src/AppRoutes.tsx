import { AppShell } from "@app/shell/AppShell";
import { AboutPage } from "@pages/AboutPage";
import { BoardPage } from "@pages/BoardPage";
import { BoardSetRootPage } from "@pages/BoardSetRootPage";
import { HomePage } from "@pages/HomePage";
import { BrowserRouter, Route, Routes } from "react-router";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="sets/:setId">
            <Route index element={<BoardSetRootPage />} />
            <Route path="boards/:boardId" element={<BoardPage />} />
          </Route>
          <Route path="about" element={<AboutPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
