import { LanguageProvider } from "@shared/language/language-provider";
import { SnackbarProvider } from "@shared/snackbar/snackbar-provider";
import { SpeechProvider } from "@shared/speech/speech-provider";
import { ThemeProvider } from "@shared/theme/theme-provider";
import type { ReactNode } from "react";

export interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SpeechProvider>
      <LanguageProvider>
        <ThemeProvider>
          <SnackbarProvider>{children}</SnackbarProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SpeechProvider>
  );
}
