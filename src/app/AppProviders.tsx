import { BoardProvider } from "@features/board/context/BoardProvider";
import { AIProvider } from "@shared/contexts/AIProvider/AIProvider";
import { LanguageProvider } from "@shared/contexts/LanguageProvider/LanguageProvider";
import { SnackbarProvider } from "@shared/contexts/SnackbarProvider/SnackbarProvider";
import { SpeechProvider } from "@shared/contexts/SpeechProvider/SpeechProvider";
import { ThemeProvider } from "@shared/contexts/ThemeProvider/ThemeProvider";
import type { ReactNode } from "react";

export interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <SnackbarProvider>
        <SpeechProvider>
          <LanguageProvider>
            <AIProvider>
              <BoardProvider>{children}</BoardProvider>
            </AIProvider>
          </LanguageProvider>
        </SpeechProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}
