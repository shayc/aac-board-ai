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
import { useIsTranslatingBoards } from "./board-translation-coordinator";

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

  // Reuse the live region so assistive technology announces the phase change.
  if (progress !== null) {
    return (
      <TranslationStatusAlert
        icon={<DownloadingIcon fontSize="inherit" />}
        title={t(m.languageDownloading)}
        description={t(m.modelDownloadProgress, {
          progress: Math.round(progress * 100),
        })}
      />
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
  description?: string;
}

function TranslationStatusAlert({
  icon,
  title,
  description,
}: TranslationStatusAlertProps) {
  return (
    <Alert role="status" severity="info" variant="outlined" icon={icon}>
      <AlertTitle>{title}</AlertTitle>
      {description !== undefined && <Typography>{description}</Typography>}
    </Alert>
  );
}
