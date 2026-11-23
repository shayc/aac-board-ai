import { normalizeLocale } from "@shared/language/locale";
import type { OBFBoard, OBFButton, OBFMedia } from "@shayc/open-board-format";
import type { Board, BoardAction, BoardButton } from "../board-types";
import { nonBlankText } from "../non-blank-text";
import { obfToTranslationsByLocale } from "./obf-strings";

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
    grid: { order: obfBoard.grid.order },
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

  // Use || so an empty OBF source falls through to the next source.
  return assetURL || media.data || media.url;
}

function obfToBoardButton(
  obfButton: OBFButton,
  imageSrcById: ReadonlyMap<string, string>,
  soundSrcById: ReadonlyMap<string, string>,
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

// Imported colors are interpolated into CSS expressions.
function sanitizeColor(color: string | undefined): string | undefined {
  if (color === undefined) {
    return undefined;
  }

  return CSS.supports("color", color) ? color : undefined;
}

function collectActions(obfButton: OBFButton): BoardAction[] {
  const rawActions =
    obfButton.actions ?? (obfButton.action ? [obfButton.action] : []);

  return rawActions.map(parseAction);
}

function parseAction(raw: string): BoardAction {
  if (raw.startsWith("+")) {
    return { kind: "spell", text: raw.slice(1).trim() };
  }

  switch (raw) {
    case ":space":
      return { kind: "space" };
    case ":backspace":
      return { kind: "backspace" };
    case ":clear":
      return { kind: "clear" };
    case ":home":
      return { kind: "home" };
    case ":speak":
      return { kind: "play" };
    default:
      return { kind: "unsupported", raw };
  }
}
