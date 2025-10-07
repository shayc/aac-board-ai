import { Route, Routes } from "react-router";
import { AppLayout } from "./layouts/AppLayout";
import { About } from "./pages/About";
import { Board } from "./pages/Board";
import { Home } from "./pages/Home";

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="sets/:setId/boards/:boardId" element={<Board />} />
        <Route path="about" element={<About />} />
      </Route>
    </Routes>
  );
}
