import { useLatestAsync } from "@shared/hooks/use-latest-async";
import { listBoards, type BoardRecord } from "../storage/boards-db";

export interface UseSetBoardsOptions {
  setId: string;
}

export interface UseSetBoardsReturn {
  boards: BoardRecord[];
  isLoading: boolean;
}

export function useSetBoards({
  setId,
}: UseSetBoardsOptions): UseSetBoardsReturn {
  const { value, isPending } = useLatestAsync({
    enabled: true,
    deps: [setId],
    fetch: () => listBoards(setId),
  });

  const boards = value ?? [];

  return {
    boards: [...boards].sort((a, b) => a.name.localeCompare(b.name)),
    isLoading: isPending,
  };
}
