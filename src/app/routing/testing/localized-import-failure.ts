import { routeErrorCodes } from "../route-error";

export const localizedImportFailure = {
  data: { code: routeErrorCodes.boardURLImportFailed },
  init: { status: 400 },
};
