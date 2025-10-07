import type { ReactNode } from "react";
import { BoardProvider } from "./BoardProvider";
import { SpeechProvider } from "./SpeechProvider";
import { ThemeProvider } from "./ThemeProvider";

export interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <SpeechProvider>
        <BoardProvider>{children}</BoardProvider>
      </SpeechProvider>
    </ThemeProvider>
  );
}
