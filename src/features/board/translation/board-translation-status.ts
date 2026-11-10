import {
  createExternalStore,
  useExternalStore,
} from "@shared/state/external-store";

const isTranslatingBoardsStore = createExternalStore(false);

export function setIsTranslatingBoards(isTranslating: boolean): void {
  isTranslatingBoardsStore.setState(isTranslating);
}

export function useIsTranslatingBoards(): boolean {
  return useExternalStore(isTranslatingBoardsStore);
}
