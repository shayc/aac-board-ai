import DownloadingIcon from "@mui/icons-material/Downloading";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useAvailableLanguages } from "@shared/language/use-available-languages";
import { useLanguage } from "@shared/language/use-language";
import { useTranslate } from "@shared/language/use-translate";
import {
  isSupported,
  useGlobalDownloadProgress,
} from "@shayc/react-built-in-ai";
import { useId } from "react";

export function LanguageSettings() {
  const t = useTranslate();
  const selectId = useId();
  const labelId = useId();
  const { language, setLanguage } = useLanguage();
  const availableLanguages = useAvailableLanguages();
  const progress = useGlobalDownloadProgress("Translator");
  const isTranslationSupported = isSupported("Translator");

  return (
    <Stack spacing={2}>
      <FormControl size="small" fullWidth>
        <InputLabel id={labelId}>{t(m.languageLabel)}</InputLabel>
        <Select
          id={selectId}
          labelId={labelId}
          label={t(m.languageLabel)}
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          variant="outlined"
        >
          {availableLanguages.map(({ code, name }) => (
            <MenuItem key={code} value={code}>
              {name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {!isTranslationSupported && (
        <Typography sx={{ typography: "body2", color: "text.secondary" }}>
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
