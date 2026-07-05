import Link, { type LinkProps } from "@mui/material/Link";
import visuallyHidden from "@mui/utils/visuallyHidden";
import { m } from "@paraglide/messages.js";

export type ExternalLinkProps = Omit<LinkProps, "target" | "rel">;

export function ExternalLink({ children, ...props }: ExternalLinkProps) {
  return (
    <Link
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      underline="always"
      sx={{ whiteSpace: "nowrap" }}
    >
      {children}
      <span style={visuallyHidden}> {m.opensInNewTab()}</span>
    </Link>
  );
}
