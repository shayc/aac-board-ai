import { normalizeLocale } from "@shared/utils/locale";
import type { MediaSource } from "@shared/media/media-source";
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
  BoardStrings,
  ButtonBehavior,
} from "../types";
import { sanitizeColor } from "./css-color";
import { parseAction } from "./parse-action";

export function obfToBoard(
  obfBoard: OBFBoard,
  assets: ReadonlyMap<string, Blob> = new Map(),
): Board {
  const imageSourceById = buildMediaSourceMap(obfBoard.images, assets);
  const soundSourceById = buildMediaSourceMap(obfBoard.sounds, assets);

  const board: Board = {
    id: obfBoard.id,
    name: obfBoard.name,
    sourceLocale: obfBoard.locale
      ? normalizeLocale(obfBoard.locale)
      : undefined,
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
  assets: ReadonlyMap<string, Blob>,
): Map<string, MediaSource> {
  const mediaSourceById = new Map<string, MediaSource>();

  if (!media) {
    return mediaSourceById;
  }

  for (const item of media) {
    const source =
      (item.path ? assets.get(item.path) : undefined) ??
      resolveMediaSource(item);
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
  imageSourceById: ReadonlyMap<string, MediaSource>,
  soundSourceById: ReadonlyMap<string, MediaSource>,
): BoardButton {
  return {
    id: obfButton.id,
    label: obfButton.label,
    vocalization: obfButton.vocalization,
    backgroundColor: sanitizeColor(obfButton.background_color),
    borderColor: sanitizeColor(obfButton.border_color),
    image: obfButton.image_id
      ? imageSourceById.get(obfButton.image_id)
      : undefined,
    sound: obfButton.sound_id
      ? soundSourceById.get(obfButton.sound_id)
      : undefined,
    behavior: resolveBehavior(obfButton),
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

function resolveBehavior(button: OBFButton): ButtonBehavior {
  if (button.load_board?.id) {
    return { kind: "navigate", boardId: button.load_board.id };
  }

  const actions = collectActions(button);

  return actions.length > 0
    ? { kind: "actions", actions }
    : { kind: "compose" };
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
