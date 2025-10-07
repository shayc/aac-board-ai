import { Outlet } from "react-router";

export function AppLayout() {
  return (
    <div>
      <h1>My App</h1>
      <Outlet />
    </div>
  );
}