import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import type { SxProps, Theme } from "@mui/material/styles";
import { Fragment, type ReactNode, useId } from "react";

interface SettingsRadioOption<Value extends string> {
  value: Value;
  label: string;
}

interface SettingsRadioGroupProps<Value extends string> {
  label: string;
  helperText?: string;
  value: Value;
  onChange: (value: Value) => void;
  options: readonly SettingsRadioOption<Value>[];
  renderOption?: (option: SettingsRadioOption<Value>) => ReactNode;
  optionsSx?: SxProps<Theme>;
}

export function SettingsRadioGroup<Value extends string>({
  label,
  helperText,
  value,
  onChange,
  options,
  renderOption = renderRadioOption,
  optionsSx,
}: SettingsRadioGroupProps<Value>) {
  const labelId = useId();
  const helperTextId = useId();

  function selectOption(selectedValue: string) {
    const selected = options.find((option) => option.value === selectedValue);
    if (selected) {
      onChange(selected.value);
    }
  }

  return (
    <FormControl>
      <FormLabel id={labelId} sx={{ color: "text.primary" }}>
        {label}
      </FormLabel>

      <RadioGroup
        aria-labelledby={labelId}
        aria-describedby={helperText ? helperTextId : undefined}
        value={value}
        onChange={(event) => selectOption(event.target.value)}
        row
        sx={optionsSx}
      >
        {options.map((option) => (
          <Fragment key={option.value}>{renderOption(option)}</Fragment>
        ))}
      </RadioGroup>

      {helperText && (
        <FormHelperText id={helperTextId} sx={{ mx: 0 }}>
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
}

function renderRadioOption({ value, label }: SettingsRadioOption<string>) {
  return <FormControlLabel value={value} control={<Radio />} label={label} />;
}
