import { BOARD_ROUTE_ID } from "@app/routing/route-ids";
import type { BoardMediaResource, HydratedBoard } from "@features/board";
import { useEffect } from "react";
import { useRouteLoaderData } from "react-router";

let committedMedia: BoardMediaResource | undefined;

export function useBoardRouteMediaLifecycle(): void {
  const loadedBoard = useRouteLoaderData<HydratedBoard>(BOARD_ROUTE_ID);
  const media = loadedBoard?.media;

  // The persistent app shell observes the board route becoming unmatched.
  // Effect cleanup would revoke live media during Strict Mode's replay.
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
