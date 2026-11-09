import { isRecord } from "@shared/utils/is-record";
import { data } from "react-router";

export const routeErrorCodes = {
  boardNotFound: "board-not-found",
  boardSetNotFound: "board-set-not-found",
  boardURLImportFailed: "board-url-import-failed",
} as const;

export type RouteErrorCode =
  (typeof routeErrorCodes)[keyof typeof routeErrorCodes];

interface RouteErrorPayload {
  code: RouteErrorCode;
}

const statusByCode: Record<RouteErrorCode, number> = {
  [routeErrorCodes.boardNotFound]: 404,
  [routeErrorCodes.boardSetNotFound]: 404,
  [routeErrorCodes.boardURLImportFailed]: 400,
};

export function routeErrorResponse(code: RouteErrorCode) {
  const payload: RouteErrorPayload = { code };

  return data(payload, { status: statusByCode[code] });
}

export function isRouteErrorPayload(
  value: unknown,
): value is RouteErrorPayload {
  return isRecord(value) && isRouteErrorCode(value.code);
}

function isRouteErrorCode(value: unknown): value is RouteErrorCode {
  return Object.values(routeErrorCodes).some((code) => code === value);
}
