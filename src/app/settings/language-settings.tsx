import DownloadingIcon from "@mui/icons-material/Downloading";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useLanguageOptions } from "@shared/language/use-language-options";
import { useLanguage } from "@shared/language/use-language";
import { useTranslate } from "@shared/language/use-translate";
import { SettingsSelect } from "@shared/ui/settings-select";
import {
  isSupported,
  useGlobalDownloadProgress,
} from "@shayc/react-built-in-ai";

export function LanguageSettings() {
  const t = useTranslate();
  const { language, setLanguage } = useLanguage();
  const languageOptions = useLanguageOptions();
  const progress = useGlobalDownloadProgress("Translator");
  const isTranslationSupported = isSupported("Translator");

  return (
    <Stack spacing={2}>
      <SettingsSelect
        label={t(m.languageLabel)}
        value={language}
        onChange={setLanguage}
      >
        {languageOptions.map(({ code, name }) => (
          <MenuItem key={code} value={code}>
            {name}
          </MenuItem>
        ))}
      </SettingsSelect>

      {!isTranslationSupported && (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {t(m.languageTranslationUnavailable)}
        </Typography>
      )}

      {isTranslationSupported && progress !== null && (
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
      )}
    </Stack>
  );
}
