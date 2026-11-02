import {
  getStoredBoardSet,
  InvalidIdError,
  rootBoardPath,
} from "@features/board";
import { data, redirect, type LoaderFunctionArgs } from "react-router";
import { createRouteErrorPayload, routeErrorCodes } from "../route-error";

export async function boardSetIndexLoader({
  params,
}: LoaderFunctionArgs): Promise<Response> {
  const { boardSetId } = params;
  let boardSet;
  try {
    boardSet = boardSetId ? await getStoredBoardSet(boardSetId) : undefined;
  } catch (error) {
    if (!(error instanceof InvalidIdError)) {
      throw error;
    }
  }

  if (!boardSet) {
    throw data(createRouteErrorPayload(routeErrorCodes.boardSetNotFound), {
      status: 404,
    });
  }

  return redirect(rootBoardPath(boardSet));
}
