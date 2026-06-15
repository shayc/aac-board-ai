import { useLanguage } from "@shared/language/use-language";
import { useEffect, useState } from "react";
import { getBoard, type BoardSetRecord } from "../storage/boards-db";
import { findTranslations } from "../translation/board-strings";
import type { BoardStrings } from "../types";

export interface TranslatedBoardSetMeta {
  name: string;
  description: string | undefined;
}

interface LoadedStrings {
  key: string;
  strings: BoardStrings | undefined;
}

export function useTranslatedBoardSetMeta(
  boardSet: BoardSetRecord | null,
): TranslatedBoardSetMeta | null {
  const { language } = useLanguage();
  const [loaded, setLoaded] = useState<LoadedStrings>();

  const setId = boardSet?.setId ?? null;
  const rootBoardId = boardSet?.rootBoardId ?? null;
  const key = setId && rootBoardId ? `${setId}/${rootBoardId}` : null;

  useEffect(() => {
    if (setId === null || rootBoardId === null || key === null) {
      return;
    }

    let active = true;

    void getBoard(setId, rootBoardId).then((record) => {
      if (active) {
        setLoaded({ key, strings: record?.obf.strings });
      }
    });

    return () => {
      active = false;
    };
  }, [setId, rootBoardId, key]);

  if (!boardSet) {
    return null;
  }

  const strings = loaded?.key === key ? loaded.strings : undefined;
  const translations = findTranslations(strings, language);
  const lookup = (phrase: string) => translations?.[phrase] ?? phrase;

  return {
    name: lookup(boardSet.name),
    description: boardSet.description
      ? lookup(boardSet.description)
      : undefined,
  };
}
