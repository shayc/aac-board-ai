import { AppShell } from "@app/shell/AppShell";
import { AboutPage } from "@pages/AboutPage";
import { BoardPage } from "@pages/BoardPage";
import { BoardSetRootRedirect } from "@pages/BoardSetRootRedirect";
import { HomePage } from "@pages/HomePage";
import { BrowserRouter, Route, Routes } from "react-router";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="sets/:setId">
            <Route index element={<BoardSetRootRedirect />} />
            <Route path="boards/:boardId" element={<BoardPage />} />
          </Route>
          <Route path="about" element={<AboutPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
