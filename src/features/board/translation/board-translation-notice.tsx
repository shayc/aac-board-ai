import DownloadingIcon from "@mui/icons-material/Downloading";
import TranslateIcon from "@mui/icons-material/Translate";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { assertNever } from "@shared/utils/assert-never";
import { isSupported } from "@shayc/react-built-in-ai";
import type { ReactNode } from "react";
import { useBoardTranslationStatus } from "./board-translation-coordinator";

export function BoardTranslationNotice() {
  const t = useTranslate();
  const status = useBoardTranslationStatus();

  if (!isSupported("Translator")) {
    return (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {t(m.languageTranslationUnavailable)}
      </Typography>
    );
  }

  // The first translation into a language downloads its model, so both states
  // render the same alert, and its text moves from the download to the boards.
  switch (status.kind) {
    case "idle":
      return null;
    case "downloading":
      return (
        <TranslationStatusAlert
          icon={<DownloadingIcon fontSize="inherit" />}
          title={t(m.languageDownloading)}
          description={t(m.languageDownloadProgress, {
            progress: Math.round(status.progress * 100),
          })}
        />
      );
    case "translating":
      return (
        <TranslationStatusAlert
          icon={<TranslateIcon fontSize="inherit" />}
          title={t(m.languageTranslating)}
        />
      );
    default:
      return assertNever(status);
  }
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
  // A polite status, so progress updates don't interrupt screen reader speech.
  return (
    <Alert role="status" severity="info" variant="outlined" icon={icon}>
      <AlertTitle>{title}</AlertTitle>
      {description !== undefined && <Typography>{description}</Typography>}
    </Alert>
  );
}
