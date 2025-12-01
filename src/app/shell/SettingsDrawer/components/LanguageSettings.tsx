import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { useLanguage } from "@shared/contexts/LanguageProvider/useLanguage";
import { getAICapabilities } from "@shared/hooks/ai/getAICapabilities";

export function LanguageSettings() {
  const { languages, languageCode, setLanguageCode } = useLanguage();
  const { isTranslatorSupported } = getAICapabilities();

  return (
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
  );
}
