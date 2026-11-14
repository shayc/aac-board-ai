import { DocumentLanguage } from "@shared/language/document-language";
import { PlaybackProvider } from "@shared/playback/playback-provider";
import { SnackbarProvider } from "@shared/snackbar/snackbar-provider";
import { getSpeechParameters } from "@shared/speech/speech-store";
import { AppThemeProvider } from "@shared/theme/app-theme-provider";
import type { ReactNode } from "react";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <PlaybackProvider getSpeechParameters={getSpeechParameters}>
      <AppThemeProvider>
        <DocumentLanguage />
        <SnackbarProvider>{children}</SnackbarProvider>
      </AppThemeProvider>
    </PlaybackProvider>
  );
}
