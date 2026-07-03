import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import { useColorScheme } from "@mui/material/styles";
import { m } from "@paraglide/messages.js";

export function AppearanceSettings() {
  const { mode, setMode } = useColorScheme();

  if (!mode) {
    return null;
  }

  return (
    <FormControl>
      <FormLabel
        id="theme-toggle"
        sx={{ typography: "body2", color: "text.secondary" }}
      >
        {m.themeLabel()}
      </FormLabel>
      <RadioGroup
        aria-labelledby="theme-toggle"
        name="theme-toggle"
        value={mode}
        onChange={(event) =>
          setMode(event.target.value as "system" | "light" | "dark")
        }
      >
        <FormControlLabel
          value="system"
          control={<Radio />}
          label={m.themeSystem()}
        />
        <FormControlLabel
          value="light"
          control={<Radio />}
          label={m.themeLight()}
        />
        <FormControlLabel
          value="dark"
          control={<Radio />}
          label={m.themeDark()}
        />
      </RadioGroup>
    </FormControl>
  );
}
