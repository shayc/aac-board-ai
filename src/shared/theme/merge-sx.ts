import type { SxProps, Theme } from "@mui/material/styles";
import type { SystemStyleObject } from "@mui/system/styleFunctionSx";

type SxItem =
  | boolean
  | SystemStyleObject<Theme>
  | ((theme: Theme) => SystemStyleObject<Theme>);

export function mergeSx(
  base: SxItem,
  override: SxProps<Theme> | undefined,
): SxProps<Theme> {
  if (!override) {
    return [base];
  }

  const overrides = Array.isArray(override)
    ? (override as readonly SxItem[])
    : [override as SxItem];

  return [base, ...overrides];
}
