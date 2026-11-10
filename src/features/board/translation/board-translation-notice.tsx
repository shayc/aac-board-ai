import DownloadingIcon from "@mui/icons-material/Downloading";
import TranslateIcon from "@mui/icons-material/Translate";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import {
  isSupported,
  useGlobalDownloadProgress,
} from "@shayc/react-built-in-ai";
import type { ReactNode } from "react";
import { useIsTranslatingBoards } from "./board-translation-status";

export function BoardTranslationNotice() {
  const t = useTranslate();
  const progress = useGlobalDownloadProgress("Translator");
  const isTranslating = useIsTranslatingBoards();

  if (!isSupported("Translator")) {
    return (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {t(m.languageTranslationUnavailable)}
      </Typography>
    );
  }

  // The first translation into a language downloads its model, so both states
  // render the same alert, and its text moves from the download to the boards.
  if (progress !== null) {
    return (
      <TranslationStatusAlert
        icon={<DownloadingIcon fontSize="inherit" />}
        title={t(m.languageDownloading)}
      >
        {t(m.languageDownloadProgress, {
          progress: Math.round(progress * 100),
        })}
      </TranslationStatusAlert>
    );
  }

  if (isTranslating) {
    return (
      <TranslationStatusAlert
        icon={<TranslateIcon fontSize="inherit" />}
        title={t(m.languageTranslating)}
      />
    );
  }

  return null;
}

interface TranslationStatusAlertProps {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
}

function TranslationStatusAlert({
  icon,
  title,
  children,
}: TranslationStatusAlertProps) {
  return (
    <Alert severity="info" variant="outlined" icon={icon}>
      <AlertTitle>{title}</AlertTitle>
      {children && <Typography>{children}</Typography>}
    </Alert>
  );
}
