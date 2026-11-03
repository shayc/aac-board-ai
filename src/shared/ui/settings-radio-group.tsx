import FormControl from "@mui/material/FormControl";
import { formControlLabelClasses } from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import RadioGroup from "@mui/material/RadioGroup";
import type { SxProps, Theme } from "@mui/material/styles";
import { mergeSx } from "@shared/theme/merge-sx";
import { useId, type ReactNode } from "react";

interface SettingsRadioGroupProps<Value extends string> {
  label: string;
  value: Value;
  onChange: (value: Value) => void;
  children: ReactNode;
  optionsSx?: SxProps<Theme>;
}

export function SettingsRadioGroup<Value extends string>({
  label,
  value,
  onChange,
  children,
  optionsSx,
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
        sx={mergeSx(
          { [`& .${formControlLabelClasses.root}`]: { minHeight: 48 } },
          optionsSx,
        )}
      >
        {children}
      </RadioGroup>
    </FormControl>
  );
}
