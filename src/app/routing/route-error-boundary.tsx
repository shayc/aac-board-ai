import { m } from "@paraglide/messages.js";
import { type Translate, useTranslate } from "@shared/language/use-translate";
import { useRouteError } from "react-router";
import {
  getRouteErrorCode,
  type RouteErrorCode,
  routeErrorCodes,
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
    case routeErrorCodes.boardNotFound:
      return t(m.errorBoardNotFound);
    case routeErrorCodes.boardSetNotFound:
      return t(m.errorBoardSetNotFound);
    case routeErrorCodes.boardFileURLImportFailed:
      return t(m.errorBoardFileURLImportFailed);
  }
}
