import type {
  Board,
  BoardAction,
  BoardButton,
  BoardGrid,
  TranslationsByLocale,
} from "@shared/board/board-types";
import { normalizeLocale } from "@shared/language/locale";
import type {
  OBFBoard,
  OBFButton,
  OBFGrid,
  OBFMedia,
} from "@shayc/open-board-format";
import { nonBlankText } from "../non-blank-text";
import { sanitizeColor } from "./sanitize-color";
import { parseAction } from "./parse-action";

export function obfToBoard(
  obfBoard: OBFBoard,
  assetURLByPath: ReadonlyMap<string, string> = new Map(),
): Board {
  const imageSrcById = buildMediaSrcById(obfBoard.images, assetURLByPath);
  const soundSrcById = buildMediaSrcById(obfBoard.sounds, assetURLByPath);

  return {
    id: obfBoard.id,
    name: nonBlankText(obfBoard.name) ?? "",
    locale: obfBoard.locale ? normalizeLocale(obfBoard.locale) : undefined,
    buttons: obfBoard.buttons.map((obfButton) =>
      obfToBoardButton(obfButton, imageSrcById, soundSrcById),
    ),
    grid: obfToBoardGrid(obfBoard.grid),
    translationsByLocale: obfToTranslationsByLocale(obfBoard.strings),
  };
}

function buildMediaSrcById(
  media: readonly OBFMedia[] | undefined,
  assetURLByPath: ReadonlyMap<string, string>,
): Map<string, string> {
  const mediaSrcById = new Map<string, string>();

  if (!media) {
    return mediaSrcById;
  }

  for (const item of media) {
    const src = resolveMediaSrc(item, assetURLByPath);
    if (src) {
      mediaSrcById.set(item.id, src);
    }
  }

  return mediaSrcById;
}

function resolveMediaSrc(
  media: OBFMedia,
  assetURLByPath: ReadonlyMap<string, string>,
): string | undefined {
  const assetURL = media.path ? assetURLByPath.get(media.path) : undefined;

  return assetURL ?? media.data ?? media.url;
}

function obfToBoardButton(
  obfButton: OBFButton,
  imageSrcById: Map<string, string>,
  soundSrcById: Map<string, string>,
): BoardButton {
  return {
    id: obfButton.id,
    label: nonBlankText(obfButton.label) ?? "",
    vocalization: nonBlankText(obfButton.vocalization),
    backgroundColor: sanitizeColor(obfButton.background_color),
    borderColor: sanitizeColor(obfButton.border_color),
    imageSrc: obfButton.image_id
      ? imageSrcById.get(obfButton.image_id)
      : undefined,
    soundSrc: obfButton.sound_id
      ? soundSrcById.get(obfButton.sound_id)
      : undefined,
    actions: collectActions(obfButton),
    linkedBoardId: obfButton.load_board?.id,
  };
}

function collectActions(obfButton: OBFButton): BoardAction[] {
  const rawActions =
    obfButton.actions ?? (obfButton.action ? [obfButton.action] : []);

  return rawActions.map(parseAction).filter((action) => action !== undefined);
}

export function obfToTranslationsByLocale(
  strings: OBFBoard["strings"],
): TranslationsByLocale {
  if (!strings) {
    return new Map();
  }

  return new Map(
    Object.entries(strings).map(([locale, translations]) => [
      normalizeLocale(locale),
      new Map(Object.entries(translations)),
    ]),
  );
}

function obfToBoardGrid(obfGrid: OBFGrid): BoardGrid {
  return {
    rows: obfGrid.rows,
    columns: obfGrid.columns,
    order: obfGrid.order,
  };
}
