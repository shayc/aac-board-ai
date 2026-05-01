import type { FocusEvent, RefObject } from "react";
import { useState } from "react";
import { useKeyboard } from "react-aria";

interface GridCell {
  row: number;
  col: number;
}

export interface UseGridKeyboardOptions {
  gridRef: RefObject<HTMLElement | null>;
  rows: number;
  columns: number;
  defaultActiveCell?: GridCell;
}

export interface UseGridKeyboardReturn {
  keyboardProps: ReturnType<typeof useKeyboard>["keyboardProps"];
  activeCell: GridCell;
  handleFocus: (event: FocusEvent<HTMLElement>) => void;
}

interface CellResult {
  element: HTMLElement;
  row: number;
  col: number;
}

export function useGridKeyboard({
  gridRef,
  rows,
  columns,
  defaultActiveCell = { row: 0, col: 0 },
}: UseGridKeyboardOptions): UseGridKeyboardReturn {
  const [activeCell, setActiveCell] = useState<GridCell>(defaultActiveCell);

  const { keyboardProps } = useKeyboard({
    onKeyDown: (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
        return;
      }

      const grid = gridRef.current;
      if (!grid) {
        return;
      }

      const cell = (event.target as HTMLElement).closest<HTMLElement>(
        "[role='gridcell']",
      );
      if (!cell) {
        return;
      }

      const currentRow =
        parseInt(cell.getAttribute("aria-rowindex") ?? "", 10) - 1;
      const currentCol =
        parseInt(cell.getAttribute("aria-colindex") ?? "", 10) - 1;

      if (isNaN(currentRow) || isNaN(currentCol)) {
        return;
      }

      let deltaRow = 0;
      let deltaCol = 0;

      switch (event.key) {
        case "ArrowUp":
          deltaRow = -1;
          break;
        case "ArrowDown":
          deltaRow = 1;
          break;
        case "ArrowLeft":
          deltaCol = -1;
          break;
        case "ArrowRight":
          deltaCol = 1;
          break;
        default:
          return;
      }

      const result = findNextNonEmptyCell(
        grid,
        currentRow + deltaRow,
        currentCol + deltaCol,
        rows,
        columns,
        deltaRow,
        deltaCol,
      );

      if (result) {
        event.preventDefault();
        setActiveCell({ row: result.row, col: result.col });
        result.element.focus();
      }
    },
  });

  const handleFocus = (event: FocusEvent<HTMLElement>) => {
    const cell = event.target.closest<HTMLElement>("[role='gridcell']");
    if (!cell) {
      return;
    }

    const row = parseInt(cell.getAttribute("aria-rowindex") ?? "", 10) - 1;
    const col = parseInt(cell.getAttribute("aria-colindex") ?? "", 10) - 1;

    if (!isNaN(row) && !isNaN(col)) {
      setActiveCell({ row, col });
    }
  };

  return { keyboardProps, activeCell, handleFocus };
}

function findNextNonEmptyCell(
  grid: HTMLElement,
  startRow: number,
  startCol: number,
  rows: number,
  columns: number,
  deltaRow: number,
  deltaCol: number,
): CellResult | null {
  let row = startRow;
  let col = startCol;

  while (row >= 0 && row < rows && col >= 0 && col < columns) {
    const cell = grid.querySelector<HTMLElement>(
      `[role='gridcell'][aria-rowindex='${row + 1}'][aria-colindex='${col + 1}']`,
    );
    const focusable = cell?.querySelector<HTMLElement>("[tabindex]");

    if (focusable) {
      return { element: focusable, row, col };
    }

    row += deltaRow;
    col += deltaCol;
  }

  return null;
}
