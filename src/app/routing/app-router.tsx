import { perfRouterInstrumentations } from "@perf";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { appRoutes } from "./app-routes";

const router = createBrowserRouter(appRoutes, {
  instrumentations: perfRouterInstrumentations,
});

export function AppRouter() {
  return <RouterProvider router={router} />;
}
