import { boardSetPath, getBoardSets } from "@features/board";
import { redirect, type LoaderFunctionArgs } from "react-router";

const DEFAULT_BOARD_URL = `${import.meta.env.BASE_URL}quick-core-24.obz`;

export interface RootIndexLoaderData {
  importUrl: string;
}

export async function rootIndexLoader({
  request,
}: LoaderFunctionArgs): Promise<Response | RootIndexLoaderData> {
  const importUrl = new URL(request.url).searchParams.get("board");

  if (importUrl) {
    return { importUrl };
  }

  const [boardSet] = await getBoardSets();
  if (boardSet) {
    return redirect(boardSetPath(boardSet));
  }

  return { importUrl: DEFAULT_BOARD_URL };
}
