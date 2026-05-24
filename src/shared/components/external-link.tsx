import Link, { type LinkProps } from "@mui/material/Link";

export function ExternalLink(props: LinkProps) {
  return (
    <Link
      underline="hover"
      {...props}
      target="_blank"
      rel="noopener noreferrer"
    />
  );
}
