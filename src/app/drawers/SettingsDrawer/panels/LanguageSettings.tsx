import DownloadingIcon from "@mui/icons-material/Downloading";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { isTranslatorSupported } from "@shared/ai/capabilities";
import { useAI } from "@shared/ai/useAI";
import { useLanguage } from "@shared/language/useLanguage";

export function LanguageSettings() {
  const { languages, language, setLanguage } = useLanguage();
  const { downloads } = useAI();

  const isDownloading = downloads.translator > 0 && downloads.translator < 1;

  return (
    <Stack spacing={2}>
      <FormControl size="small" fullWidth>
        <InputLabel id="language-select-label">Language</InputLabel>
        <Select
          variant="outlined"
          label="Language"
          labelId="language-select-label"
          id="language-select"
          value={language}
          disabled={!isTranslatorSupported}
          onChange={(event) => setLanguage(event.target.value)}
        >
          {languages.map((lang) => (
            <MenuItem key={lang.code} value={lang.code}>
              {lang.name}
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
          <AlertTitle>Downloading language</AlertTitle>
          <Typography>
            {Math.round(downloads.translator * 100)}% complete...
          </Typography>
        </Alert>
      )}
    </Stack>
  );
}
