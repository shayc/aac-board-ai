import DownloadingIcon from "@mui/icons-material/Downloading";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import { useAI } from "@shared/contexts/AIProvider/useAI";
import { useLanguage } from "@shared/contexts/LanguageProvider/useLanguage";
import { getAICapabilities } from "@shared/hooks/ai/getAICapabilities";

export function LanguageSettings() {
  const { languages, languageCode, setLanguageCode } = useLanguage();
  const { isTranslatorSupported } = getAICapabilities();
  const { downloads } = useAI();

  const isDownloading = downloads.translator !== 1;

  return (
    <>
      <FormControl size="small" fullWidth sx={{ mb: 2 }}>
        <InputLabel id="language-select-label">Language</InputLabel>
        <Select
          label="Language"
          labelId="language-select-label"
          id="language-select"
          value={languageCode}
          disabled={!isTranslatorSupported}
          onChange={(event) => setLanguageCode(event.target.value)}
        >
          {languages.map((language) => (
            <MenuItem key={language.code} value={language.code}>
              {language.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {isDownloading && (
        <Alert
          severity="info"
          variant="filled"
          icon={<DownloadingIcon fontSize="inherit" />}
          sx={{ mb: 4 }}
        >
          <AlertTitle>Downloading language</AlertTitle>
          <Typography>
            {Math.round(downloads.translator * 100)}% complete...
          </Typography>
        </Alert>
      )}
    </>
  );
}
