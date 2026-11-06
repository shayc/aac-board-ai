import { CommunicationBoard, type Board } from "@features/board";
import { PerfProfiler, usePerfSpan } from "@perf";
import { useLoaderData } from "react-router";

export function BoardPage() {
  const board = useLoaderData<Board>();

  usePerfSpan("load:app:board", board);
  usePerfSpan("route:board:open", board);

  return (
    <>
      <title>{board.name}</title>
      <PerfProfiler id="CommunicationBoard">
        <CommunicationBoard board={board} />
      </PerfProfiler>
    </>
  );
}
