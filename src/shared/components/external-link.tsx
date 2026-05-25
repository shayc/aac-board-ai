import Link, { type LinkProps } from "@mui/material/Link";

export function ExternalLink(props: Omit<LinkProps, "target" | "rel">) {
  return (
    <Link
      underline="hover"
      {...props}
      target="_blank"
      rel="noopener noreferrer"
    />
  );
}
