import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import { useColorScheme } from "@mui/material/styles";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { m } from "@paraglide/messages.js";
import { CheckIcon } from "@phosphor-icons/react/dist/csr/Check";
import { MonitorIcon } from "@phosphor-icons/react/dist/csr/Monitor";
import { MoonIcon } from "@phosphor-icons/react/dist/csr/Moon";
import { SunIcon } from "@phosphor-icons/react/dist/csr/Sun";
import { useTranslate } from "@shared/language/use-translate";
import { PhosphorIcon } from "@shared/ui/phosphor-icon";
import { type MouseEvent, useId } from "react";

const THEME_OPTIONS = [
  { value: "system", message: m.themeSystem, icon: MonitorIcon },
  { value: "light", message: m.themeLight, icon: SunIcon },
  { value: "dark", message: m.themeDark, icon: MoonIcon },
] as const;

// Side by side, icon and name overflow a phone's drawer in most languages.
const optionSx = {
  flex: "1 1 0",
  flexDirection: "column",
  gap: 0.5,
  minWidth: 0,
  px: 0.5,
  lineHeight: 1.2,
  hyphens: "auto",
} as const;

type ThemeMode = (typeof THEME_OPTIONS)[number]["value"];

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
        fullWidth
        onChange={handleChange}
        sx={{ mt: 1 }}
      >
        {THEME_OPTIONS.map(({ value, message, icon }) => (
          <ToggleButton key={value} value={value} sx={optionSx}>
            {/* The checkmark shows the selection without relying on color. */}
            <PhosphorIcon icon={mode === value ? CheckIcon : icon} />
            {t(message)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </FormControl>
  );
}
