import { AppRouter } from "@app/routing/app-router";
import { PerfProfiler, startPerf } from "@perf";
import { AppProviders } from "@shared/providers/app-providers";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}

startPerf();

createRoot(rootElement).render(
  <StrictMode>
    <PerfProfiler id="App">
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </PerfProfiler>
  </StrictMode>,
);
