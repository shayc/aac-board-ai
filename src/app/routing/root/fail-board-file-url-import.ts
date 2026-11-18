import { ROUTE_ERROR_CODES, routeErrorResponse } from "../route-error";

/**
 * Ends a `?board=` navigation on the "import failed" page. That page names no
 * cause and reportRouteError skips it, so the cause is reported here.
 */
export function failBoardFileURLImport(cause: unknown): never {
  reportError(cause);
  throw routeErrorResponse(ROUTE_ERROR_CODES.boardFileURLImportFailed);
}
