import { boardSetIdFromPath, useActiveBoardSetId } from "@features/library";
import { useNavigation, useRevalidator } from "react-router";

type RevalidateBoardSet = (boardSetId: string) => void;

export function useRevalidateBoardSet(): RevalidateBoardSet {
  const { revalidate } = useRevalidator();
  const activeBoardSetId = useActiveBoardSetId();
  const pendingPathname = useNavigation().location?.pathname;

  function revalidateBoardSet(boardSetId: string) {
    const pendingBoardSetId =
      pendingPathname && boardSetIdFromPath(pendingPathname);

    // Unrelated revalidation could restart an in-flight ?board= import.
    if (boardSetId === activeBoardSetId || boardSetId === pendingBoardSetId) {
      void revalidate();
    }
  }

  return revalidateBoardSet;
}
