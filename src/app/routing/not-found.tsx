import Button from "@mui/material/Button";
import { m } from "@paraglide/messages.js";
import { ErrorState } from "@shared/ui/error-state";
import { useTranslate } from "@shared/language/use-translate";
import { Link } from "react-router";

export function NotFound() {
  const t = useTranslate();
  const title = t(m.errorPageNotFound);

  return (
    <>
      <title>{title}</title>
      <ErrorState
        title={title}
        action={
          <Button component={Link} to="/" variant="contained">
            {t(m.errorGoHome)}
          </Button>
        }
      />
    </>
  );
}
