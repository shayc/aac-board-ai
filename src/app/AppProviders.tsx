import { LanguageProvider } from "@shared/language/LanguageProvider";
import { SnackbarProvider } from "@shared/snackbar/SnackbarProvider";
import { SpeechProvider } from "@shared/speech/SpeechProvider";
import { ThemeProvider } from "@shared/theme/ThemeProvider";
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
