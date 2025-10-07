import type { ReactNode } from "react";
import { BoardProvider } from "./BoardProvider";
import { LanguageProvider } from "./LanguageProvider";
import { SpeechProvider } from "./SpeechProvider";
import { ThemeProvider } from "./ThemeProvider";

export interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <SpeechProvider>
        <LanguageProvider>
          <BoardProvider>{children}</BoardProvider>
        </LanguageProvider>
      </SpeechProvider>
    </ThemeProvider>
  );
}
