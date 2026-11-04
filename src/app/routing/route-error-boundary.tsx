import { m } from "@paraglide/messages.js";
import { useTranslate, type Translate } from "@shared/language/use-translate";
import { isRouteErrorResponse, useRouteError } from "react-router";
import {
  isRouteErrorPayload,
  routeErrorCodes,
  type RouteErrorCode,
} from "./route-error";
import { RouteErrorPage } from "./route-error-page";

export function RouteErrorBoundary() {
  const t = useTranslate();
  const error = useRouteError();

  return <RouteErrorPage title={getErrorTitle(error, t)} />;
}

function getErrorTitle(error: unknown, t: Translate): string {
  if (isRouteErrorResponse(error) && isRouteErrorPayload(error.data)) {
    return translateRouteError(error.data.code, t);
  }

  return t(m.errorGenericTitle);
}

function translateRouteError(code: RouteErrorCode, t: Translate): string {
  switch (code) {
    case routeErrorCodes.boardNotFound:
      return t(m.errorBoardNotFound);
    case routeErrorCodes.boardSetNotFound:
      return t(m.errorBoardSetNotFound);
    case routeErrorCodes.boardUrlImportFailed:
      return t(m.errorBoardUrlImportFailed);
  }
}
