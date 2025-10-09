import { Route, Routes } from "react-router";
import { AppShell } from "./app/shell/AppShell";
import { AboutPage } from "./pages/AboutPage";
import { BoardPage } from "./pages/BoardPage";
import { HomePage } from "./pages/HomePage";

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="sets/:setId/boards/:boardId" element={<BoardPage />} />
        <Route path="about" element={<AboutPage />} />
      </Route>
    </Routes>
  );
}
