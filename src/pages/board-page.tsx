import { CommunicationBoard, type HydratedBoard } from "@features/board";
import { useLoaderData } from "react-router";

export function BoardPage() {
  const { board } = useLoaderData<HydratedBoard>();

  return (
    <>
      <title lang={board.nameLanguage ?? ""}>{board.name}</title>
      <CommunicationBoard board={board} />
    </>
  );
}
