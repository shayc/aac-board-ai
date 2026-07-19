import { sanitizeColor } from "@shared/utils/css-color";
import { normalizeLocale } from "@shared/utils/locale";
import type {
  OBFBoard,
  OBFButton,
  OBFGrid,
  OBFLoadBoard,
  OBFMedia,
} from "@shayc/open-board-format";
import type {
  Board,
  BoardAction,
  BoardButton,
  BoardGrid,
  BoardStrings,
  LoadBoard,
} from "../types";
import { parseAction } from "./parse-action";

export function obfToBoard(obfBoard: OBFBoard): Board {
  const imageSourceById = buildMediaSourceMap(obfBoard.images);
  const soundSourceById = buildMediaSourceMap(obfBoard.sounds);

  const board: Board = {
    id: obfBoard.id,
    name: obfBoard.name,
    locale: obfBoard.locale ? normalizeLocale(obfBoard.locale) : undefined,
    buttons: obfBoard.buttons.map((obfButton) =>
      transformButton(obfButton, imageSourceById, soundSourceById),
    ),
    grid: transformGrid(obfBoard.grid),
    strings: transformStrings(obfBoard.strings),
  };

  return board;
}

function buildMediaSourceMap(
  media: OBFMedia[] | undefined,
): Map<string, string> {
  const mediaSourceById = new Map<string, string>();

  if (!media) {
    return mediaSourceById;
  }

  for (const item of media) {
    const source = resolveMediaSource(item);
    if (source) {
      mediaSourceById.set(item.id, source);
    }
  }

  return mediaSourceById;
}

function resolveMediaSource(media: OBFMedia): string | undefined {
  return media.data ?? media.path ?? media.url;
}

function transformButton(
  obfButton: OBFButton,
  imageSourceById: Map<string, string>,
  soundSourceById: Map<string, string>,
): BoardButton {
  return {
    id: obfButton.id,
    label: obfButton.label,
    vocalization: obfButton.vocalization,
    backgroundColor: sanitizeColor(obfButton.background_color),
    borderColor: sanitizeColor(obfButton.border_color),
    imageSrc: obfButton.image_id
      ? imageSourceById.get(obfButton.image_id)
      : undefined,
    soundSrc: obfButton.sound_id
      ? soundSourceById.get(obfButton.sound_id)
      : undefined,
    actions: collectActions(obfButton),
    loadBoard: transformLoadBoard(obfButton.load_board),
  };
}

function collectActions(obfButton: OBFButton): BoardAction[] {
  const rawActions =
    obfButton.actions ?? (obfButton.action ? [obfButton.action] : []);

  return rawActions.flatMap((raw) => {
    const action = parseAction(raw);

    return action ? [action] : [];
  });
}

function transformLoadBoard(
  obfLoadBoard: OBFLoadBoard | undefined,
): LoadBoard | undefined {
  return obfLoadBoard?.id ? { id: obfLoadBoard.id } : undefined;
}

function transformStrings(
  strings: OBFBoard["strings"],
): BoardStrings | undefined {
  if (!strings) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(strings).map(([locale, translations]) => [
      normalizeLocale(locale),
      translations,
    ]),
  );
}

function transformGrid(obfGrid: OBFGrid): BoardGrid {
  return {
    rows: obfGrid.rows,
    columns: obfGrid.columns,
    order: obfGrid.order,
  };
}
