import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import ListSubheader from "@mui/material/ListSubheader";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useLanguage } from "@shared/language/use-language";
import {
  DWELL_DURATION_MS,
  SCAN_INTERVAL_MS,
  setDwellDurationMs,
  setScanIntervalMs,
  setSwitchScanningEnabled,
  setSwitchScanningMethod,
  type SwitchScanningMethod,
  useSwitchScanningConfig,
} from "@shared/switch-scanning/switch-scanning-store";

const MILLISECONDS_PER_SECOND = 1_000;

function getMethodLabel(method: SwitchScanningMethod): string {
  switch (method) {
    case "auto":
      return m.switchScanningMethodAuto();
    case "step":
      return m.switchScanningMethodStep();
    case "dwell":
      return m.switchScanningMethodDwell();
    case "inverse":
      return m.switchScanningMethodInverse();
  }
}

function getMethodHint(method: SwitchScanningMethod): string {
  switch (method) {
    case "auto":
      return m.switchScanningAutoHint();
    case "step":
      return m.switchScanningStepHint();
    case "dwell":
      return m.switchScanningDwellHint();
    case "inverse":
      return m.switchScanningInverseHint();
  }
}

export function SwitchScanningSettings() {
  const { language } = useLanguage();
  const { enabled, method, scanIntervalMs, dwellDurationMs } =
    useSwitchScanningConfig();

  const seconds = new Intl.NumberFormat(language, {
    style: "unit",
    unit: "second",
    unitDisplay: "long",
    maximumFractionDigits: 1,
  });

  const timing =
    method === "dwell"
      ? {
          label: m.switchScanningDwellDuration(),
          value: dwellDurationMs,
          range: DWELL_DURATION_MS,
          onChange: setDwellDurationMs,
        }
      : method === "auto" || method === "inverse"
        ? {
            label: m.switchScanningInterval(),
            value: scanIntervalMs,
            range: SCAN_INTERVAL_MS,
            onChange: setScanIntervalMs,
          }
        : null;

  const methodGroups: readonly {
    label: string;
    methods: readonly SwitchScanningMethod[];
  }[] = [
    {
      label: m.switchScanningOneSwitch(),
      methods: ["auto", "dwell", "inverse"],
    },
    { label: m.switchScanningTwoSwitches(), methods: ["step"] },
  ];

  function renderMethodGroup(
    label: string,
    methods: readonly SwitchScanningMethod[],
  ) {
    return [
      <ListSubheader key={`${methods[0]}-heading`}>{label}</ListSubheader>,
      ...methods.map((option) => {
        const optionLabel = getMethodLabel(option);

        return (
          <MenuItem
            key={option}
            value={option}
            aria-label={`${optionLabel}, ${label}`}
          >
            {optionLabel}
          </MenuItem>
        );
      }),
    ];
  }

  return (
    <Stack spacing={3}>
      <FormControlLabel
        label={m.switchScanningEnabled()}
        control={
          <Switch
            checked={enabled}
            onChange={(event) => setSwitchScanningEnabled(event.target.checked)}
          />
        }
      />

      <FormControl size="small" fullWidth disabled={!enabled}>
        <InputLabel id="switch-scanning-method-label">
          {m.switchScanningMethod()}
        </InputLabel>
        <Select
          id="switch-scanning-method"
          labelId="switch-scanning-method-label"
          label={m.switchScanningMethod()}
          value={method}
          onChange={(event) => setSwitchScanningMethod(event.target.value)}
        >
          {methodGroups.flatMap(({ label, methods }) =>
            renderMethodGroup(label, methods),
          )}
        </Select>
        <FormHelperText
          sx={{
            color: "text.secondary",
            "&.Mui-disabled": { color: "text.secondary" },
          }}
        >
          {getMethodHint(method)}
        </FormHelperText>
      </FormControl>

      {timing && (
        <Stack spacing={0.5}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {timing.label}
          </Typography>
          <Slider
            disabled={!enabled}
            aria-label={timing.label}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => seconds.format(value)}
            getAriaValueText={(value) => seconds.format(value)}
            value={timing.value / MILLISECONDS_PER_SECOND}
            min={timing.range.min / MILLISECONDS_PER_SECOND}
            max={timing.range.max / MILLISECONDS_PER_SECOND}
            step={0.1}
            onChange={(_event, value) =>
              timing.onChange(value * MILLISECONDS_PER_SECOND)
            }
          />
        </Stack>
      )}
    </Stack>
  );
}
