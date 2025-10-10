import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import { useState } from "react";

const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
];

export function LanguageSettings() {
  const [languageCode, setLanguageCode] = useState("en");

  return (
    <Box>
      <Typography gutterBottom>Language</Typography>
      <FormControl size="small" fullWidth>
        <InputLabel id="demo-simple-select-label">Language</InputLabel>
        <Select
          label="Language"
          labelId="demo-simple-select-label"
          id="demo-simple-select"
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
