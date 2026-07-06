import {
  boardSetPath,
  getBoardSets,
  importBoardFromUrl,
  type BoardSetRecord,
} from "@features/board";
import { redirect, type LoaderFunctionArgs } from "react-router";

const DEFAULT_BOARD_URL = `${import.meta.env.BASE_URL}quick-core-24.obz`;

type BoardSource =
  | { kind: "existing"; boardSet: BoardSetRecord }
  | { kind: "import"; url: string };

function decideBoardSource(
  boardUrl: string | null,
  boardSets: BoardSetRecord[],
): BoardSource {
  if (boardUrl) {
    return { kind: "import", url: boardUrl };
  }

  const [boardSet] = boardSets;
  if (boardSet) {
    return { kind: "existing", boardSet };
  }

  return { kind: "import", url: DEFAULT_BOARD_URL };
}

export async function rootIndexLoader({
  request,
}: LoaderFunctionArgs): Promise<Response> {
  const boardUrl = new URL(request.url).searchParams.get("board");
  const boardSets = await getBoardSets();
  const source = decideBoardSource(boardUrl, boardSets);

  const boardSet =
    source.kind === "import"
      ? await importBoardFromUrl(source.url)
      : source.boardSet;

  return redirect(boardSetPath(boardSet));
}
