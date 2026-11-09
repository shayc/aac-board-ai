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
import { useBoardSetTranslationProgress } from "./translate-board-set";

export function BoardTranslationNotice() {
  const t = useTranslate();
  const downloadProgress = useGlobalDownloadProgress("Translator");
  const translationProgress = useBoardSetTranslationProgress();

  if (!isSupported("Translator")) {
    return (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {t(m.languageTranslationUnavailable)}
      </Typography>
    );
  }

  if (downloadProgress !== null) {
    return (
      <ProgressNotice
        icon={<DownloadingIcon fontSize="inherit" />}
        title={t(m.languageDownloading)}
        progress={downloadProgress}
      />
    );
  }

  if (translationProgress !== null) {
    return (
      <ProgressNotice
        icon={<TranslateIcon fontSize="inherit" />}
        title={t(m.languageTranslatingBoards)}
        progress={translationProgress.completed / translationProgress.total}
      />
    );
  }

  return null;
}

interface ProgressNoticeProps {
  icon: ReactNode;
  title: string;
  progress: number;
}

function ProgressNotice({ icon, title, progress }: ProgressNoticeProps) {
  const t = useTranslate();

  return (
    <Alert severity="info" variant="outlined" icon={icon}>
      <AlertTitle>{title}</AlertTitle>
      <Typography>
        {t(m.languageDownloadProgress, {
          progress: Math.round(progress * 100),
        })}
      </Typography>
    </Alert>
  );
}
