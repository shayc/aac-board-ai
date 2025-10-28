import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import { useLanguage } from "@shared/contexts/LanguageProvider/useLanguage";

export function LanguageSettings() {
  const { languages, languageCode, setLanguageCode } = useLanguage();

  return (
    <Box sx={{ mb: 3 }}>
      <Typography gutterBottom>Language</Typography>
      <FormControl size="small" fullWidth>
        <InputLabel id="language-select-label">Language</InputLabel>
        <Select
          label="Language"
          labelId="language-select-label"
          id="language-select"
          value={languageCode}
          onChange={(event) => setLanguageCode(event.target.value)}
        >
          {languages.map((language) => (
            <MenuItem key={language.code} value={language.code}>
              {language.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
