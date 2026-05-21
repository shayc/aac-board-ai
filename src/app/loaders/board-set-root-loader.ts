import { getBoardSets } from "@features/board";
import {
  data,
  generatePath,
  redirect,
  type LoaderFunctionArgs,
} from "react-router";

export async function boardSetRootLoader({
  params,
}: LoaderFunctionArgs): Promise<Response> {
  const setId = params.setId ?? "";
  const sets = await getBoardSets();
  const set = sets.find((s) => s.setId === setId);

  if (!set) {
    // React Router catches thrown `data()` and routes it to ErrorBoundary as
    // a route error response — the v7-canonical way to signal an expected 4xx.
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw data("Board set not found", { status: 404 });
  }
  if (!set.rootBoardId) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw data("Board set incomplete", { status: 422 });
  }

  return redirect(
    generatePath("/sets/:setId/boards/:boardId", {
      setId,
      boardId: set.rootBoardId,
    }),
  );
}
