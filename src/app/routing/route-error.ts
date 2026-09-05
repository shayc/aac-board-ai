export const routeErrorCodes = {
  boardNotFound: "board-not-found",
  boardSetNotFound: "board-set-not-found",
  boardUrlImportFailed: "board-url-import-failed",
} as const;

export type RouteErrorCode =
  (typeof routeErrorCodes)[keyof typeof routeErrorCodes];

export interface RouteErrorPayload {
  code: RouteErrorCode;
}

export function createRouteErrorPayload(
  code: RouteErrorCode,
): RouteErrorPayload {
  return { code };
}

export function isRouteErrorPayload(
  error: unknown,
): error is RouteErrorPayload {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return false;
  }

  return Object.values(routeErrorCodes).includes(error.code as RouteErrorCode);
}
