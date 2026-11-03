import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";

interface SettingsSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function SettingsSwitch({
  label,
  checked,
  onChange,
}: SettingsSwitchProps) {
  return (
    <FormControlLabel
      label={label}
      control={
        <Switch
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
      }
      labelPlacement="start"
      sx={{ justifyContent: "space-between", m: 0 }}
    />
  );
}
