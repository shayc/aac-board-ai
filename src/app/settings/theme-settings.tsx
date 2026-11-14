import CheckIcon from "@mui/icons-material/Check";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import DesktopWindowsOutlinedIcon from "@mui/icons-material/DesktopWindowsOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import { useColorScheme } from "@mui/material/styles";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { type MouseEvent, useId } from "react";

const themeOptions = [
  { value: "system", message: m.themeSystem, Icon: DesktopWindowsOutlinedIcon },
  { value: "light", message: m.themeLight, Icon: LightModeOutlinedIcon },
  { value: "dark", message: m.themeDark, Icon: DarkModeOutlinedIcon },
] as const;

// Side by side, the icons and names overflow a phone's drawer in most
// languages, so each option stacks them in an equal share of the width.
const optionSx = {
  flex: "1 1 0",
  flexDirection: "column",
  gap: 0.5,
  minWidth: 0,
  px: 0.5,
  lineHeight: 1.2,
  hyphens: "auto",
} as const;

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
        {themeOptions.map(({ value, message, Icon }) => (
          <ToggleButton key={value} value={value} sx={optionSx}>
            {/* The checkmark shows the selection without relying on color. */}
            {mode === value ? <CheckIcon /> : <Icon />}
            {t(message)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </FormControl>
  );
}
