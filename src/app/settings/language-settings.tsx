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
import { isSupported, useGlobalDownloadProgress } from "@shared/built-in-ai";
import { useLanguage } from "@shared/language/use-language";

export function LanguageSettings() {
  const { languages, language, setLanguage } = useLanguage();
  const progress = useGlobalDownloadProgress("Translator");
  const isDownloading = progress > 0;

  return (
    <Stack spacing={2}>
      <FormControl size="small" fullWidth>
        <InputLabel id="language-select-label">{m.languageLabel()}</InputLabel>
        <Select
          variant="outlined"
          label={m.languageLabel()}
          labelId="language-select-label"
          id="language-select"
          value={language}
          disabled={!isSupported("Translator")}
          onChange={(event) => setLanguage(event.target.value)}
        >
          {languages.map(({ language, name }) => (
            <MenuItem key={language} value={language}>
              {name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {isDownloading && (
        <Alert
          severity="info"
          variant="outlined"
          icon={<DownloadingIcon fontSize="inherit" />}
        >
          <AlertTitle>{m.languageDownloading()}</AlertTitle>
          <Typography>
            {m.languageDownloadProgress({
              progress: Math.round(progress * 100),
            })}
          </Typography>
        </Alert>
      )}
    </Stack>
  );
}
