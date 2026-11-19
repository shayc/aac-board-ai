import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import ArrowCircleDownIcon from "@phosphor-icons/core/bold/arrow-circle-down-bold.svg?react";
import TranslateIcon from "@phosphor-icons/core/bold/translate-bold.svg?react";
import { useTranslate } from "@shared/language/use-translate";
import { PhosphorIcon } from "@shared/ui/phosphor-icon";
import { useGlobalDownloadProgress } from "@shayc/react-built-in-ai";
import type { ReactNode } from "react";
import { useIsTranslatingBoards } from "./board-translation-coordinator";

export function BoardTranslationNotice() {
  const t = useTranslate();
  const progress = useGlobalDownloadProgress("Translator");
  const isTranslating = useIsTranslatingBoards();

  // Reuse the live region so assistive technology announces the phase change.
  if (progress !== null) {
    return (
      <TranslationStatusAlert
        icon={<PhosphorIcon icon={ArrowCircleDownIcon} fontSize="inherit" />}
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
        icon={<PhosphorIcon icon={TranslateIcon} fontSize="inherit" />}
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
