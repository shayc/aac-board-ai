import Button from "@mui/material/Button";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { ErrorState } from "@shared/ui/error-state";
import { Link } from "react-router";

interface RouteErrorPageProps {
  title: string;
}

export function RouteErrorPage({ title }: RouteErrorPageProps) {
  const t = useTranslate();

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
