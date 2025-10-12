import { LanguageProvider } from "@shared/contexts/LanguageProvider/LanguageProvider";
import { SpeechProvider } from "@shared/contexts/SpeechProvider/SpeechProvider";
import { ThemeProvider } from "@shared/contexts/ThemeProvider/ThemeProvider";
import type { ReactNode } from "react";

export interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <SpeechProvider>
        <LanguageProvider>{children}</LanguageProvider>
      </SpeechProvider>
    </ThemeProvider>
  );
}
