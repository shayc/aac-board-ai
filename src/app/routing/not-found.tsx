import Button from "@mui/material/Button";
import { m } from "@paraglide/messages.js";
import { ErrorState } from "@shared/components/error-state";
import { useTranslate } from "@shared/language/use-translate";
import { Link } from "react-router";

// Catch-all target for URLs that match no route (typo'd links, stale
// bookmarks). Rendered inside the app shell so the header and a way home stay
// available, rather than falling through to react-router's unstyled default.
export function NotFound() {
  const t = useTranslate();

  return (
    <ErrorState
      title={t(m.errorPageNotFound)}
      action={
        <Button component={Link} to="/" variant="contained">
          {t(m.errorGoHome)}
        </Button>
      }
    />
  );
}
