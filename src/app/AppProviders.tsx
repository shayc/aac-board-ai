import type { ReactNode } from "react";
import { BoardProvider } from "./BoardProvider/BoardProvider";
import { LanguageProvider } from "../../shared/contexts/LanguageProvider/LanguageProvider";
import { SpeechProvider } from "../../shared/contexts/SpeechProvider/SpeechProvider";
import { ThemeProvider } from "../../shared/contexts/ThemeProvider/ThemeProvider";

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
