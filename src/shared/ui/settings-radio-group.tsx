import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import RadioGroup from "@mui/material/RadioGroup";
import type { SxProps, Theme } from "@mui/material/styles";
import { useId, type ReactNode } from "react";

interface SettingsRadioGroupProps<Value extends string> {
  label: string;
  helperText?: string;
  value: Value;
  onChange: (value: Value) => void;
  children: ReactNode;
  optionsSx?: SxProps<Theme>;
}

export function SettingsRadioGroup<Value extends string>({
  label,
  helperText,
  value,
  onChange,
  children,
  optionsSx,
}: SettingsRadioGroupProps<Value>) {
  const labelId = useId();
  const helperTextId = useId();

  return (
    <FormControl>
      <FormLabel id={labelId} sx={{ color: "text.primary" }}>
        {label}
      </FormLabel>

      <RadioGroup
        aria-labelledby={labelId}
        aria-describedby={helperText ? helperTextId : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value as Value)}
        row
        sx={optionsSx}
      >
        {children}
      </RadioGroup>

      {helperText && (
        <FormHelperText id={helperTextId} sx={{ mx: 0 }}>
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
}
