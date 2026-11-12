import type { BoardButton } from "@shared/board/board-types";
import { Tile } from "./tile";
import { useTilePreferences } from "./tile-preferences-store";

interface BoardTileProps {
  tabIndex: number;
  button: BoardButton;
  onActivate: (button: BoardButton) => void;
}

export function BoardTile({ tabIndex, button, onActivate }: BoardTileProps) {
  const { saturation, brightness, areBordersVisible, labelPlacement } =
    useTilePreferences();

  return (
    <Tile
      tabIndex={tabIndex}
      button={button}
      saturation={saturation}
      brightness={brightness}
      areBordersVisible={areBordersVisible}
      labelPlacement={labelPlacement}
      onActivate={onActivate}
    />
  );
}
