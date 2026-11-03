import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import RadioGroup from "@mui/material/RadioGroup";
import type { SxProps, Theme } from "@mui/material/styles";
import { useId, type ReactNode } from "react";

interface SettingsRadioGroupProps<Value extends string> {
  label: string;
  value: Value;
  onChange: (value: Value) => void;
  children: ReactNode;
  sx?: SxProps<Theme>;
}

export function SettingsRadioGroup<Value extends string>({
  label,
  value,
  onChange,
  children,
  sx,
}: SettingsRadioGroupProps<Value>) {
  const labelId = useId();

  return (
    <FormControl>
      <FormLabel id={labelId} sx={{ color: "text.primary" }}>
        {label}
      </FormLabel>
      <RadioGroup
        aria-labelledby={labelId}
        value={value}
        onChange={(event) => onChange(event.target.value as Value)}
        row
        sx={sx}
      >
        {children}
      </RadioGroup>
    </FormControl>
  );
}
