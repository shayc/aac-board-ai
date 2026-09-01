import { AppRouter } from "@app/routing/app-router";
import { AppProviders } from "@shared/providers/app-providers";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </StrictMode>,
);
