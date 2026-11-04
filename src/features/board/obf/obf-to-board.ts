import { normalizeLocale } from "@shared/language/locale";
import type {
  OBFBoard,
  OBFButton,
  OBFGrid,
  OBFMedia,
} from "@shayc/open-board-format";
import type {
  Board,
  BoardAction,
  BoardButton,
  BoardGrid,
  BoardTranslations,
} from "../board-types";
import { nonBlankText } from "../non-blank-text";
import { sanitizeColor } from "./sanitize-color";
import { parseAction } from "./parse-action";

export function obfToBoard(obfBoard: OBFBoard): Board {
  const imageSourceById = buildMediaSourceById(obfBoard.images);
  const soundSourceById = buildMediaSourceById(obfBoard.sounds);

  return {
    id: obfBoard.id,
    name: nonBlankText(obfBoard.name) ?? "",
    locale: obfBoard.locale ? normalizeLocale(obfBoard.locale) : undefined,
    buttons: obfBoard.buttons.map((obfButton) =>
      obfToBoardButton(obfButton, imageSourceById, soundSourceById),
    ),
    grid: obfToBoardGrid(obfBoard.grid),
    translations: obfToBoardTranslations(obfBoard.strings),
  };
}

function buildMediaSourceById(
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

function obfToBoardButton(
  obfButton: OBFButton,
  imageSourceById: Map<string, string>,
  soundSourceById: Map<string, string>,
): BoardButton {
  return {
    id: obfButton.id,
    label: nonBlankText(obfButton.label) ?? "",
    vocalization: nonBlankText(obfButton.vocalization),
    backgroundColor: sanitizeColor(obfButton.background_color),
    borderColor: sanitizeColor(obfButton.border_color),
    imageSrc: obfButton.image_id
      ? imageSourceById.get(obfButton.image_id)
      : undefined,
    soundSrc: obfButton.sound_id
      ? soundSourceById.get(obfButton.sound_id)
      : undefined,
    actions: collectActions(obfButton),
    linkedBoardId: obfButton.load_board?.id,
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

export function obfToBoardTranslations(
  strings: OBFBoard["strings"],
): BoardTranslations {
  if (!strings) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(strings).map(([locale, translations]) => [
      normalizeLocale(locale),
      translations,
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
