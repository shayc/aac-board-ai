import type {
  OBFBoard,
  OBFButton,
  OBFGrid,
  OBFLoadBoard,
  OBFSound
} from "@/shared/open-board-format/schema";
import type { Board, Button, Grid, LoadBoard } from "@features/board/types";

export function obfToBoard(obfBoard: OBFBoard): Board {
  const imageSources = buildImageMap(obfBoard);
  const soundSources = buildSoundMap(obfBoard);

  return {
    id: obfBoard.id,
    name: obfBoard.name,
    buttons: obfBoard.buttons.map((button) =>
      transformButton(button, imageSources, soundSources)
    ),
    grid: transformGrid(obfBoard.grid),
  };
}

function pickMediaSource(sound: OBFSound): string | undefined {
  if (sound.data) return sound.data;
  if (sound.path) return sound.path;
  if (sound.url) return sound.url;
  return undefined;
}

function buildImageMap(obfBoard: OBFBoard): Map<string, string> {
  const imageMap = new Map<string, string>();

  if (!obfBoard.images) return imageMap;

  for (const image of obfBoard.images) {
    const source = pickMediaSource(image);
    if (source) {
      imageMap.set(image.id, source);
    }
  }

  return imageMap;
}

function buildSoundMap(obfBoard: OBFBoard): Map<string, string> {
  const soundMap = new Map<string, string>();

  if (!obfBoard.sounds) return soundMap;

  for (const sound of obfBoard.sounds) {
    const source = pickMediaSource(sound);
    if (source) {
      soundMap.set(sound.id, source);
    }
  }

  return soundMap;
}

function transformButton(
  obfButton: OBFButton,
  imageSources: Map<string, string>,
  soundSources: Map<string, string>
): Button {
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
    actions: [obfButton.action || "", ...(obfButton.actions || [])].filter(
      Boolean
    ),
    loadBoard: obfButton.load_board
      ? transformLoadBoard(obfButton.load_board)
      : undefined,
  };
}

function transformLoadBoard(obfLoadBoard: OBFLoadBoard): LoadBoard {
  return {
    id: obfLoadBoard.id,
    name: obfLoadBoard.name,
    url: obfLoadBoard.url,
    dataUrl: obfLoadBoard.data_url,
    path: obfLoadBoard.path,
  };
}

function transformGrid(obfGrid: OBFGrid): Grid {
  return {
    rows: obfGrid.rows,
    columns: obfGrid.columns,
    order: obfGrid.order,
  };
}
