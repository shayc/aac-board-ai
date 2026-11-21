import { isRecord } from "@shared/utils/is-record";
import { data, isRouteErrorResponse } from "react-router";

export const ROUTE_ERROR_CODES = {
  boardNotFound: "board-not-found",
  boardSetNotFound: "board-set-not-found",
  boardFileURLImportFailed: "board-file-url-import-failed",
} as const;

export type RouteErrorCode =
  (typeof ROUTE_ERROR_CODES)[keyof typeof ROUTE_ERROR_CODES];

interface RouteErrorPayload {
  code: RouteErrorCode;
}

const STATUS_BY_CODE: Record<RouteErrorCode, number> = {
  [ROUTE_ERROR_CODES.boardNotFound]: 404,
  [ROUTE_ERROR_CODES.boardSetNotFound]: 404,
  [ROUTE_ERROR_CODES.boardFileURLImportFailed]: 400,
};

export function routeErrorResponse(code: RouteErrorCode) {
  const payload: RouteErrorPayload = { code };

  return data(payload, { status: STATUS_BY_CODE[code] });
}

// The error page shows only a title, so an unexpected error is reported here.
export function reportRouteError(error: unknown): void {
  if (getRouteErrorCode(error)) {
    return;
  }

  reportError(error);
}

export function getRouteErrorCode(error: unknown): RouteErrorCode | undefined {
  if (isRouteErrorResponse(error) && isRouteErrorPayload(error.data)) {
    return error.data.code;
  }

  return undefined;
}

function isRouteErrorPayload(value: unknown): value is RouteErrorPayload {
  return isRecord(value) && isRouteErrorCode(value.code);
}

function isRouteErrorCode(value: unknown): value is RouteErrorCode {
  return Object.values(ROUTE_ERROR_CODES).some((code) => code === value);
}
