import { ROUTE_ERROR_CODES } from "../errors/route-error";

export const localizedImportFailure = {
  data: { code: ROUTE_ERROR_CODES.boardFileURLImportFailed },
  init: { status: 400 },
};
