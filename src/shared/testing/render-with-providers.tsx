import { AppProviders } from "@shared/providers/app-providers";
import type { ReactNode } from "react";
import { render } from "vitest-browser-react";

export function renderWithProviders(children: ReactNode) {
  return render(children, { wrapper: AppProviders });
}
