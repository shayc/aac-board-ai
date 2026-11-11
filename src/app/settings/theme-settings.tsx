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
import { useId } from "react";

type ThemeMode = "system" | "light" | "dark";

export function ThemeSettings() {
  const t = useTranslate();
  const labelId = useId();
  const { mode, setMode } = useColorScheme();

  if (!mode) {
    return null;
  }

  const options = [
    {
      value: "system",
      label: t(m.themeSystem),
      Icon: DesktopWindowsOutlinedIcon,
    },
    { value: "light", label: t(m.themeLight), Icon: LightModeOutlinedIcon },
    { value: "dark", label: t(m.themeDark), Icon: DarkModeOutlinedIcon },
  ] as const;

  return (
    <FormControl>
      <FormLabel id={labelId} sx={{ color: "text.primary" }}>
        {t(m.themeLabel)}
      </FormLabel>
      <ToggleButtonGroup
        aria-labelledby={labelId}
        value={mode}
        exclusive
        onChange={(_event, selected: ThemeMode | null) => {
          // Pressing the active button reports null; a theme must stay selected.
          if (selected) {
            setMode(selected);
          }
        }}
        sx={{ mt: 1 }}
      >
        {options.map(({ value, label, Icon }) => (
          <Tooltip key={value} title={label}>
            <ToggleButton aria-label={label} value={value}>
              <Icon />
            </ToggleButton>
          </Tooltip>
        ))}
      </ToggleButtonGroup>
    </FormControl>
  );
}
