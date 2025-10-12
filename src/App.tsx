import { AppShell } from "@app/shell/AppShell";
import { AboutPage } from "@pages/AboutPage";
import { BoardPage } from "@pages/BoardPage";
import { BoardSetRedirect } from "@pages/BoardSetRedirect";
import { HomePage } from "@pages/HomePage";
import { Route, Routes } from "react-router";

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="sets/:setId" element={<BoardSetRedirect />} />
        <Route path="sets/:setId/boards/:boardId" element={<BoardPage />} />
        <Route path="about" element={<AboutPage />} />
      </Route>
    </Routes>
  );
}
