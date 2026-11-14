import Link, { type LinkProps } from "@mui/material/Link";
import type { SxProps, Theme } from "@mui/material/styles";
import visuallyHidden from "@mui/utils/visuallyHidden";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";

type ExternalLinkProps = Omit<LinkProps, "target" | "rel">;

export function ExternalLink({ children, sx, ...props }: ExternalLinkProps) {
  const t = useTranslate();

  return (
    <Link
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      underline="always"
      sx={mergeSx(
        {
          position: "relative",
          whiteSpace: "nowrap",
          textDecorationColor: "currentColor",
        },
        sx,
      )}
    >
      {children}
      <span style={visuallyHidden}> {t(m.opensInNewTab)}</span>
    </Link>
  );
}

type SxItem = Extract<SxProps<Theme>, readonly unknown[]>[number];

function mergeSx(
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
