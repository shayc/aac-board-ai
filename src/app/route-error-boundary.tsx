import Button from "@mui/material/Button";
import { m } from "@paraglide/messages.js";
import { ErrorState } from "@shared/components/error-state";
import { isRouteErrorResponse, Link, useRouteError } from "react-router";

export function RouteErrorBoundary() {
  const error = useRouteError();
  const title =
    isRouteErrorResponse(error) && typeof error.data === "string"
      ? error.data
      : m.errorGenericTitle();

  return (
    <ErrorState
      title={title}
      action={
        <Button component={Link} to="/" variant="contained">
          {m.errorGoHome()}
        </Button>
      }
    />
  );
}
