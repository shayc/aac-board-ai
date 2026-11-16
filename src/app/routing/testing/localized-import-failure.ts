import { routeErrorCodes } from "../route-error";

export const localizedImportFailure = {
  data: { code: routeErrorCodes.boardFileURLImportFailed },
  init: { status: 400 },
};
