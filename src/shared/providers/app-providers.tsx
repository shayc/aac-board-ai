import { LanguageProvider } from "@shared/language/language-provider";
import { PlaybackProvider } from "@shared/playback/playback-provider";
import { SnackbarProvider } from "@shared/snackbar/snackbar-provider";
import { ThemeProvider } from "@shared/theme/theme-provider";
import type { ReactNode } from "react";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <LanguageProvider>
      <PlaybackProvider>
        <ThemeProvider>
          <SnackbarProvider>{children}</SnackbarProvider>
        </ThemeProvider>
      </PlaybackProvider>
    </LanguageProvider>
  );
}
