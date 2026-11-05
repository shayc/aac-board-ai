import { CommunicationBoard, type Board } from "@features/board";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { useLoaderData } from "react-router";

export function BoardPage() {
  const t = useTranslate();
  const board = useLoaderData<Board>();

  return (
    <>
      <title>{board.name || t(m.appName)}</title>
      <CommunicationBoard board={board} />
    </>
  );
}
