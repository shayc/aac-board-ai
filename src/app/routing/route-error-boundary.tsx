import Button from "@mui/material/Button";
import { m } from "@paraglide/messages.js";
import { useTranslate, type Translate } from "@shared/language/use-translate";
import { ErrorState } from "@shared/ui/error-state";
import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import {
  isLocalizedRouteError,
  routeErrorCodes,
  type RouteErrorCode,
} from "./route-error";

export function RouteErrorBoundary() {
  const t = useTranslate();
  const error = useRouteError();
  const title = getErrorTitle(error, t);

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

function getErrorTitle(error: unknown, t: Translate): string {
  if (!isRouteErrorResponse(error)) {
    return t(m.errorGenericTitle);
  }

  if (isLocalizedRouteError(error.data)) {
    return translateRouteError(error.data.code, t);
  }

  return typeof error.data === "string" ? error.data : t(m.errorGenericTitle);
}

function translateRouteError(code: RouteErrorCode, t: Translate): string {
  switch (code) {
    case routeErrorCodes.boardNotFound:
      return t(m.errorBoardNotFound);
    case routeErrorCodes.boardSetNotFound:
      return t(m.errorBoardSetNotFound);
    case routeErrorCodes.boardUrlImportFailed:
      return t(m.boardUrlImportFailed);
  }
}
