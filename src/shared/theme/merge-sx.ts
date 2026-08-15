import type { SxProps, Theme } from "@mui/material/styles";

type SxItem = Extract<SxProps<Theme>, readonly unknown[]>[number];

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
