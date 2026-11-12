import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import DesktopWindowsOutlinedIcon from "@mui/icons-material/DesktopWindowsOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import { useColorScheme } from "@mui/material/styles";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { type MouseEvent, useId } from "react";

const themeOptions = [
  { value: "system", message: m.themeSystem, Icon: DesktopWindowsOutlinedIcon },
  { value: "light", message: m.themeLight, Icon: LightModeOutlinedIcon },
  { value: "dark", message: m.themeDark, Icon: DarkModeOutlinedIcon },
] as const;

type ThemeMode = (typeof themeOptions)[number]["value"];

export function ThemeSettings() {
  const t = useTranslate();
  const labelId = useId();
  const { mode, setMode } = useColorScheme();

  if (!mode) {
    return null;
  }

  function handleChange(_event: MouseEvent, selected: ThemeMode | null) {
    // Pressing the active button reports null; a theme must stay selected.
    if (selected) {
      setMode(selected);
    }
  }

  return (
    <FormControl fullWidth>
      <FormLabel id={labelId} sx={{ color: "text.primary" }}>
        {t(m.themeLabel)}
      </FormLabel>

      <ToggleButtonGroup
        aria-labelledby={labelId}
        value={mode}
        exclusive
        color="primary"
        fullWidth
        onChange={handleChange}
        sx={{ mt: 1 }}
      >
        {themeOptions.map(({ value, message, Icon }) => {
          const label = t(message);

          return (
            <Tooltip key={value} title={label}>
              <ToggleButton aria-label={label} value={value}>
                <Icon />
              </ToggleButton>
            </Tooltip>
          );
        })}
      </ToggleButtonGroup>
    </FormControl>
  );
}
