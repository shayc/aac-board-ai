import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { type ReactNode, useId } from "react";

// A menu taller than the room under its trigger opens on top of it, and Select
// then picks the option under the pointer when a press lasts 200ms or longer.
const MENU_MAX_HEIGHT = 320;

interface SettingsSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  action?: ReactNode;
}

export function SettingsSelect({
  label,
  value,
  onChange,
  children,
  action,
}: SettingsSelectProps) {
  const labelId = useId();

  return (
    <Stack spacing={1}>
      <Typography id={labelId}>{label}</Typography>
      <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
        <Select
          labelId={labelId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          size="small"
          fullWidth
          MenuProps={{
            slotProps: { paper: { sx: { maxHeight: MENU_MAX_HEIGHT } } },
          }}
          sx={{ minWidth: 0 }}
        >
          {children}
        </Select>
        {action}
      </Stack>
    </Stack>
  );
}
