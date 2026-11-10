import DownloadIcon from "@mui/icons-material/Download";
import DownloadingIcon from "@mui/icons-material/Downloading";
import TranslateIcon from "@mui/icons-material/Translate";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { assertNever } from "@shared/utils/assert-never";
import { isSupported } from "@shayc/react-built-in-ai";
import type { ReactNode } from "react";
import {
  retryBoardTranslation,
  useBoardTranslationStatus,
} from "./board-translation-coordinator";

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

  // A refused download, the download, and the translation follow one another,
  // so they render the same alert and only its content changes.
  switch (status.kind) {
    case "idle":
      return null;
    case "needs-download":
      return (
        <TranslationStatusAlert
          icon={<DownloadIcon fontSize="inherit" />}
          title={t(m.languageDownloadNeeded)}
        >
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            onClick={retryBoardTranslation}
          >
            {t(m.languageDownloadModel)}
          </Button>
        </TranslationStatusAlert>
      );
    case "downloading":
      return (
        <TranslationStatusAlert
          icon={<DownloadingIcon fontSize="inherit" />}
          title={t(m.languageDownloading)}
        >
          <Typography>
            {t(m.languageDownloadProgress, {
              progress: Math.round(status.progress * 100),
            })}
          </Typography>
        </TranslationStatusAlert>
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
  children?: ReactNode;
}

function TranslationStatusAlert({
  icon,
  title,
  children,
}: TranslationStatusAlertProps) {
  // A polite status, so progress updates don't interrupt screen reader speech.
  return (
    <Alert role="status" severity="info" variant="outlined" icon={icon}>
      <AlertTitle>{title}</AlertTitle>
      {children}
    </Alert>
  );
}
