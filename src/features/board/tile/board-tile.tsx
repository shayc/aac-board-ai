import { AACSymbol } from "../aac-symbol/aac-symbol";
import type { TileLabelPlacement } from "../board-preferences-store";
import type { BoardButton } from "../board-types";
import type { GridItemProps } from "../grid/grid";
import { Tile } from "./tile";

interface BoardTileProps extends GridItemProps {
  button: BoardButton;
  labelPlacement: TileLabelPlacement;
  isBorderVisible: boolean;
  onActivate: () => void;
}

export function BoardTile({
  button,
  labelPlacement,
  isBorderVisible,
  onActivate,
  ...gridItemProps
}: BoardTileProps) {
  const symbolLabelPlacement = labelPlacement === "top" ? "top" : "bottom";
  const spokenOnlyLabel = button.label ? undefined : button.vocalization;

  return (
    <Tile
      ariaLabel={spokenOnlyLabel}
      backgroundColor={button.backgroundColor}
      borderColor={button.borderColor}
      isFolder={Boolean(button.linkedBoardId)}
      isBorderVisible={isBorderVisible}
      onActivate={onActivate}
      {...gridItemProps}
    >
      <AACSymbol
        label={button.label}
        imageSrc={button.imageSrc}
        labelPlacement={symbolLabelPlacement}
        isLabelHidden={labelPlacement === "hidden"}
      />
    </Tile>
  );
}
