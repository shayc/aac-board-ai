import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import { useColorScheme } from "@mui/material/styles";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { SettingsRadioGroup } from "@shared/ui/settings-radio-group";

export function ThemeSettings() {
  const t = useTranslate();
  const { mode, setMode } = useColorScheme();

  if (!mode) {
    return null;
  }

  return (
    <SettingsRadioGroup label={t(m.themeLabel)} value={mode} onChange={setMode}>
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
    </SettingsRadioGroup>
  );
}
