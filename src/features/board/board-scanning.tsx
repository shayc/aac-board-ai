import Chip from "@mui/material/Chip";
import { m } from "@paraglide/messages.js";
import { useScanGroup, useScanTarget } from "@shayc/switch-scanning/react";
import { getNavigationTargetId } from "./button-readers";
import {
  ACTIONS_SCAN_ID,
  getTileScanId,
  getRowScanId,
  getSuggestionScanId,
} from "./board-scanning-ids";
import { GridRow, type GridItemProps, type GridRowProps } from "./grid/grid";
import { Tile } from "./tile/tile";
import type { BoardButton } from "./types";

interface ScannableTileProps extends GridItemProps {
  boardId: string;
  button: BoardButton;
  borderHidden: boolean;
  onClick: () => void;
}

interface ScannableGridRowProps extends GridRowProps {
  boardId: string;
  buttons: readonly (BoardButton | undefined)[];
  rowIndex: number;
}

interface ScannableSuggestionProps {
  boardId: string;
  phrase: string;
  onClick: () => void;
}

export function ScannableTile({
  boardId,
  button,
  borderHidden,
  tabIndex,
  onClick,
}: ScannableTileProps) {
  const label = button.label ?? "";
  const scanTarget = useScanTarget({
    id: getTileScanId(boardId, button.id),
    label,
  });

  return (
    <Tile
      {...scanTarget}
      label={label}
      imageSrc={button.imageSrc}
      backgroundColor={button.backgroundColor}
      borderColor={button.borderColor}
      variant={getNavigationTargetId(button) ? "folder" : undefined}
      borderHidden={borderHidden}
      tabIndex={tabIndex}
      onClick={onClick}
    />
  );
}

export function ScannableGridRow({
  boardId,
  buttons,
  rowIndex,
  ...rowProps
}: ScannableGridRowProps) {
  const rowNumber = rowIndex + 1;
  const sequence = buttons.flatMap((button) =>
    button ? [getTileScanId(boardId, button.id)] : [],
  );
  const scanGroup = useScanGroup({
    id: getRowScanId(boardId, rowIndex),
    label: m.switchScanningRow({ row: rowNumber }),
    exitLabel: m.switchScanningRowExit({ row: rowNumber }),
    disabled: sequence.length === 0,
    sequence,
  });

  return <GridRow {...rowProps} {...scanGroup} />;
}

export function ScannableSuggestion({
  boardId,
  phrase,
  onClick,
}: ScannableSuggestionProps) {
  const scanTarget = useScanTarget({
    id: getSuggestionScanId(boardId, phrase),
    parentId: ACTIONS_SCAN_ID,
    label: phrase,
  });

  return <Chip {...scanTarget} label={phrase} onClick={onClick} />;
}
