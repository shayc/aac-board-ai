import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import { useColorScheme } from "@mui/material/styles";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { useId } from "react";

export function ThemeSettings() {
  const t = useTranslate();
  const labelId = useId();
  const { mode, setMode } = useColorScheme();

  if (!mode) {
    return null;
  }

  return (
    <FormControl>
      <FormLabel
        id={labelId}
        sx={{ typography: "body2", color: "text.secondary" }}
      >
        {t(m.themeLabel)}
      </FormLabel>
      <RadioGroup
        aria-labelledby={labelId}
        value={mode}
        onChange={(event) =>
          setMode(event.target.value as "system" | "light" | "dark")
        }
        row
      >
        <FormControlLabel
          value="system"
          control={<Radio />}
          label={t(m.themeSystem)}
        />
        <FormControlLabel
          value="light"
          control={<Radio />}
          label={t(m.themeLight)}
        />
        <FormControlLabel
          value="dark"
          control={<Radio />}
          label={t(m.themeDark)}
        />
      </RadioGroup>
    </FormControl>
  );
}
