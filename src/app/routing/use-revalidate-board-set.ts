import { boardSetIdFromPath } from "@features/library";
import { useLocation, useNavigation, useRevalidator } from "react-router";

type RevalidateBoardSet = (boardSetId: string) => void;

export function useRevalidateBoardSet(): RevalidateBoardSet {
  const { revalidate } = useRevalidator();
  const { pathname } = useLocation();
  const pendingPathname = useNavigation().location?.pathname;

  function revalidateBoardSet(boardSetId: string) {
    const routedBoardSetIds = [pathname, pendingPathname].map(
      (path) => path && boardSetIdFromPath(path),
    );

    // Unrelated revalidation could restart an in-flight ?board= import.
    if (routedBoardSetIds.includes(boardSetId)) {
      void revalidate();
    }
  }

  return revalidateBoardSet;
}
