import type {
  Board,
  BoardAction,
  BoardButton,
  BoardGrid,
  BoardLicense,
  BoardLink,
} from "@features/board/types";
import type {
  OBFBoard,
  OBFButton,
  OBFGrid,
  OBFLicense,
  OBFLoadBoard,
  OBFMedia,
} from "open-board-format";

export function obfToBoard(obfBoard: OBFBoard): Board {
  const imageSources = buildMediaMap(obfBoard.images);
  const soundSources = buildMediaMap(obfBoard.sounds);

  return {
    id: obfBoard.id,
    name: obfBoard.name,
    locale: obfBoard.locale,
    descriptionHTML: obfBoard.description_html,
    ...(obfBoard.license && {
      license: transformLicense(obfBoard.license),
    }),
    buttons: obfBoard.buttons.map((button) =>
      transformButton(button, imageSources, soundSources),
    ),
    grid: transformGrid(obfBoard.grid),
    strings: obfBoard.strings,
  };
}

function buildMediaMap(media: OBFMedia[] | undefined): Map<string, string> {
  const map = new Map<string, string>();

  if (!media) {
    return map;
  }

  for (const item of media) {
    const source = pickMediaSource(item);
    if (source) {
      map.set(item.id, source);
    }
  }

  return map;
}

function pickMediaSource(media: OBFMedia): string | undefined {
  return media.data ?? media.path ?? media.url;
}

function transformButton(
  obfButton: OBFButton,
  imageSources: Map<string, string>,
  soundSources: Map<string, string>,
): BoardButton {
  return {
    id: obfButton.id,
    label: obfButton.label,
    vocalization: obfButton.vocalization,
    backgroundColor: obfButton.background_color,
    borderColor: obfButton.border_color,
    imageSrc: obfButton.image_id
      ? imageSources.get(obfButton.image_id)
      : undefined,
    soundSrc: obfButton.sound_id
      ? soundSources.get(obfButton.sound_id)
      : undefined,
    actions: [obfButton.action, ...(obfButton.actions ?? [])].filter(
      (a): a is BoardAction => Boolean(a),
    ),
    loadBoard: obfButton.load_board
      ? transformLoadBoard(obfButton.load_board)
      : undefined,
  };
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
