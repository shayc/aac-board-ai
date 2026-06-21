import Link, { type LinkProps } from "@mui/material/Link";

export type ExternalLinkProps = Omit<LinkProps, "target" | "rel">;

export function ExternalLink(props: ExternalLinkProps) {
  return (
    <Link
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      underline="always"
      sx={{ whiteSpace: "nowrap" }}
    />
  );
}
