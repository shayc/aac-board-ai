import DownloadingIcon from "@mui/icons-material/Downloading";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import {
  isSupported,
  useGlobalDownloadProgress,
} from "@shayc/react-built-in-ai";

export function BoardTranslationNotice() {
  const t = useTranslate();
  const progress = useGlobalDownloadProgress("Translator");

  if (!isSupported("Translator")) {
    return (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {t(m.languageTranslationUnavailable)}
      </Typography>
    );
  }

  if (progress === null) {
    return null;
  }

  return (
    <Alert
      severity="info"
      variant="outlined"
      icon={<DownloadingIcon fontSize="inherit" />}
    >
      <AlertTitle>{t(m.languageDownloading)}</AlertTitle>
      <Typography>
        {t(m.languageDownloadProgress, {
          progress: Math.round(progress * 100),
        })}
      </Typography>
    </Alert>
  );
}
