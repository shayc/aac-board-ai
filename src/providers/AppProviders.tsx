import type { ReactNode } from "react";
import { BoardProvider } from "./BoardProvider/BoardProvider";
import { LanguageProvider } from "./LanguageProvider/LanguageProvider";
import { SpeechProvider } from "./SpeechProvider/SpeechProvider";
import { ThemeProvider } from "./ThemeProvider/ThemeProvider";

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
