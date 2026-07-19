export const routeErrorCodes = {
  boardNotFound: "board-not-found",
  boardSetNotFound: "board-set-not-found",
  boardUrlImportFailed: "board-url-import-failed",
} as const;

export type RouteErrorCode =
  (typeof routeErrorCodes)[keyof typeof routeErrorCodes];

export interface LocalizedRouteError {
  code: RouteErrorCode;
}

export function createLocalizedRouteError(
  code: RouteErrorCode,
): LocalizedRouteError {
  return { code };
}

export function isLocalizedRouteError(
  error: unknown,
): error is LocalizedRouteError {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return false;
  }

  return Object.values(routeErrorCodes).includes(error.code as RouteErrorCode);
}
