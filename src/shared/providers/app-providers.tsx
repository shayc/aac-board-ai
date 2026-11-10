import { DocumentLanguage } from "@shared/language/document-language";
import { PlaybackProvider } from "@shared/playback/playback-provider";
import { SnackbarProvider } from "@shared/snackbar/snackbar-provider";
import { ThemeProvider } from "@shared/theme/theme-provider";
import type { ReactNode } from "react";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <PlaybackProvider>
      <ThemeProvider>
        <DocumentLanguage />
        <SnackbarProvider>{children}</SnackbarProvider>
      </ThemeProvider>
    </PlaybackProvider>
  );
}
