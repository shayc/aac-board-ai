import type { BoardMediaResource, HydratedBoard } from "@features/board";
import { useEffect } from "react";
import { useRouteLoaderData } from "react-router";

export const BOARD_ROUTE_ID = "board";

let committedMedia: BoardMediaResource | undefined;

export function useBoardMediaLifetime(): void {
  const loadedBoard = useRouteLoaderData<HydratedBoard>(BOARD_ROUTE_ID);
  const media = loadedBoard?.media;

  // Route data becoming undefined is the unmount signal. Effect cleanup would
  // revoke live media during Strict Mode's development replay.
  useEffect(() => replaceCommittedMedia(media), [media]);
}

function replaceCommittedMedia(next: BoardMediaResource | undefined): void {
  if (next === committedMedia) {
    return;
  }

  next?.commit();

  const previous = committedMedia;
  committedMedia = next;
  previous?.dispose();
}
