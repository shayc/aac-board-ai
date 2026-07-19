import Link, { type LinkProps } from "@mui/material/Link";
import visuallyHidden from "@mui/utils/visuallyHidden";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";

type ExternalLinkProps = Omit<LinkProps, "target" | "rel">;

export function ExternalLink({ children, ...props }: ExternalLinkProps) {
  const t = useTranslate();

  return (
    <Link
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      underline="always"
      sx={{ whiteSpace: "nowrap" }}
    >
      {children}
      <span style={visuallyHidden}> {t(m.opensInNewTab)}</span>
    </Link>
  );
}
