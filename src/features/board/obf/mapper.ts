import { normalizeLocale } from "@shared/utils/locale";
import type {
  OBFBoard,
  OBFButton,
  OBFGrid,
  OBFLicense,
  OBFLoadBoard,
  OBFMedia,
} from "open-board-format";
import type {
  Board,
  BoardAction,
  BoardButton,
  BoardGrid,
  BoardLicense,
  BoardLink,
} from "../types";

export function obfToBoard(obfBoard: OBFBoard): Board {
  const imageSourceById = buildMediaSourceMap(obfBoard.images);
  const soundSourceById = buildMediaSourceMap(obfBoard.sounds);

  const board: Board = {
    id: obfBoard.id,
    name: obfBoard.name,
    locale: obfBoard.locale ? normalizeLocale(obfBoard.locale) : undefined,
    descriptionHTML: obfBoard.description_html,
    buttons: obfBoard.buttons.map((obfButton) =>
      transformButton(obfButton, imageSourceById, soundSourceById),
    ),
    grid: transformGrid(obfBoard.grid),
    strings: obfBoard.strings
      ? Object.fromEntries(
          Object.entries(obfBoard.strings).map(([locale, translations]) => [
            normalizeLocale(locale),
            translations,
          ]),
        )
      : undefined,
  };

  if (obfBoard.license) {
    board.license = transformLicense(obfBoard.license);
  }

  return board;
}

export function resolveLoadBoardPaths(
  obfBoard: OBFBoard,
  boardIdByPath: Map<string, string>,
): OBFBoard {
  const buttons = obfBoard.buttons.map((obfButton) => {
    if (!obfButton.load_board?.path || obfButton.load_board.id) {
      return obfButton;
    }

    const targetBoardId = boardIdByPath.get(obfButton.load_board.path);
    if (!targetBoardId) {
      return obfButton;
    }

    return {
      ...obfButton,
      load_board: { ...obfButton.load_board, id: targetBoardId },
    };
  });

  return { ...obfBoard, buttons };
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
    backgroundColor: obfButton.background_color,
    borderColor: obfButton.border_color,
    imageSrc: obfButton.image_id
      ? imageSourceById.get(obfButton.image_id)
      : undefined,
    soundSrc: obfButton.sound_id
      ? soundSourceById.get(obfButton.sound_id)
      : undefined,
    actions: collectActions(obfButton),
    loadBoard: obfButton.load_board
      ? transformLoadBoard(obfButton.load_board)
      : undefined,
  };
}

function collectActions(obfButton: OBFButton): BoardAction[] {
  const raw = [obfButton.action, ...(obfButton.actions ?? [])];
  return raw.flatMap((value) => {
    const action = value ? parseAction(value) : null;
    return action ? [action] : [];
  });
}

function parseAction(raw: string): BoardAction | null {
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
      return { kind: "speak" };
    default:
      return null;
  }
}

function transformLoadBoard(obfLoadBoard: OBFLoadBoard): BoardLink {
  return {
    id: obfLoadBoard.id,
    name: obfLoadBoard.name,
    url: obfLoadBoard.url,
    dataUrl: obfLoadBoard.data_url,
    path: obfLoadBoard.path,
  };
}

function transformGrid(obfGrid: OBFGrid): BoardGrid {
  return {
    rows: obfGrid.rows,
    columns: obfGrid.columns,
    order: obfGrid.order,
  };
}

function transformLicense(obfLicense: OBFLicense): BoardLicense {
  return {
    type: obfLicense.type,
    copyrightNoticeUrl: obfLicense.copyright_notice_url,
    sourceUrl: obfLicense.source_url,
    authorName: obfLicense.author_name,
    authorUrl: obfLicense.author_url,
    authorEmail: obfLicense.author_email,
  };
}
