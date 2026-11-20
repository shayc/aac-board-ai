import { m } from "@paraglide/messages.js";
import { type Translate, useTranslate } from "@shared/language/use-translate";
import { assertNever } from "@shared/utils/assert-never";
import { useRouteError } from "react-router";
import {
  getRouteErrorCode,
  ROUTE_ERROR_CODES,
  type RouteErrorCode,
} from "./route-error";
import { RouteErrorPage } from "./route-error-page";

export function RouteErrorBoundary() {
  const t = useTranslate();
  const error = useRouteError();

  return <RouteErrorPage title={getErrorTitle(error, t)} />;
}

function getErrorTitle(error: unknown, t: Translate): string {
  const code = getRouteErrorCode(error);
  if (code) {
    return translateRouteError(code, t);
  }

  return t(m.errorGenericTitle);
}

function translateRouteError(code: RouteErrorCode, t: Translate): string {
  switch (code) {
    case ROUTE_ERROR_CODES.boardNotFound:
      return t(m.errorBoardNotFound);
    case ROUTE_ERROR_CODES.boardSetNotFound:
      return t(m.errorBoardSetNotFound);
    case ROUTE_ERROR_CODES.boardFileURLImportFailed:
      return t(m.errorBoardFileURLImportFailed);
    default:
      return assertNever(code);
  }
}
