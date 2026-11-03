import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useId, type ReactNode } from "react";

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
          sx={{ minWidth: 0 }}
        >
          {children}
        </Select>
        {action}
      </Stack>
    </Stack>
  );
}
