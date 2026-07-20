import Link, { type LinkProps } from "@mui/material/Link";
import visuallyHidden from "@mui/utils/visuallyHidden";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { mergeSx } from "@shared/theme/merge-sx";

type ExternalLinkProps = Omit<LinkProps, "target" | "rel">;

export function ExternalLink({ children, sx, ...props }: ExternalLinkProps) {
  const t = useTranslate();

  return (
    <Link
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      underline="always"
      sx={mergeSx({ whiteSpace: "nowrap" }, sx)}
    >
      {children}
      <span style={visuallyHidden}> {t(m.opensInNewTab)}</span>
    </Link>
  );
}
