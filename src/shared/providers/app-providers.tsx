import { useUIDirection, useUILocale } from "@shared/language/language-store";
import { PlaybackProvider } from "@shared/playback/playback-provider";
import { SnackbarProvider } from "@shared/snackbar/snackbar-provider";
import { getSpeechParameters } from "@shared/speech/speech-store";
import { ThemeProvider } from "@shared/theme/theme-provider";
import { type ReactNode, useLayoutEffect } from "react";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <PlaybackProvider getSpeechParameters={getSpeechParameters}>
      <ThemeProvider>
        <DocumentLanguage />
        <SnackbarProvider>{children}</SnackbarProvider>
      </ThemeProvider>
    </PlaybackProvider>
  );
}

function DocumentLanguage() {
  const uiLocale = useUILocale();
  const uiDirection = useUIDirection();

  useLayoutEffect(() => {
    document.documentElement.lang = uiLocale;
    document.documentElement.dir = uiDirection;
  }, [uiLocale, uiDirection]);

  return null;
}
