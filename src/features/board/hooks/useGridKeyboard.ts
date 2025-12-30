import type { FocusEvent, RefObject } from "react";
import { useState } from "react";
import { useKeyboard } from "react-aria";

interface GridCell {
  row: number;
  col: number;
}

interface UseGridKeyboardOptions {
  cellRefs: RefObject<(HTMLElement | null)[][]>;
  rows: number;
  columns: number;
  defaultActiveCell?: GridCell;
}

interface CellResult {
  element: HTMLElement;
  row: number;
  col: number;
}

export function useGridKeyboard({
  cellRefs,
  rows,
  columns,
  defaultActiveCell = { row: 0, col: 0 },
}: UseGridKeyboardOptions) {
  const [activeCell, setActiveCell] = useState<GridCell>(defaultActiveCell);

  const { keyboardProps } = useKeyboard({
    onKeyDown: (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
        return;
      }

      const grid = cellRefs.current;
      if (!grid) {
        return;
      }

      const cell = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-grid-cell]",
      );
      if (!cell) {
        return;
      }

      const currentRow = parseInt(cell.dataset.row ?? "", 10);
      const currentCol = parseInt(cell.dataset.col ?? "", 10);

      if (isNaN(currentRow) || isNaN(currentCol)) {
        return;
      }

      let dRow = 0;
      let dCol = 0;

      switch (event.key) {
        case "ArrowUp":
          dRow = -1;
          break;
        case "ArrowDown":
          dRow = 1;
          break;
        case "ArrowLeft":
          dCol = -1;
          break;
        case "ArrowRight":
          dCol = 1;
          break;
        default:
          return;
      }

      const result = findNextNonEmptyCell(
        grid,
        currentRow + dRow,
        currentCol + dCol,
        rows,
        columns,
        dRow,
        dCol,
      );

      if (result) {
        event.preventDefault();
        setActiveCell({ row: result.row, col: result.col });
        result.element.focus();
      }
    },
  });

  const handleFocus = (event: FocusEvent<HTMLElement>) => {
    const cell = event.target.closest<HTMLElement>("[data-grid-cell]");
    if (!cell) {
      return;
    }

    const row = parseInt(cell.dataset.row ?? "", 10);
    const col = parseInt(cell.dataset.col ?? "", 10);

    if (!isNaN(row) && !isNaN(col)) {
      setActiveCell({ row, col });
    }
  };

  return { keyboardProps, activeCell, handleFocus };
}

function findNextNonEmptyCell(
  grid: (HTMLElement | null)[][],
  startRow: number,
  startCol: number,
  rows: number,
  columns: number,
  dRow: number,
  dCol: number,
): CellResult | null {
  let r = startRow;
  let c = startCol;

  while (r >= 0 && r < rows && c >= 0 && c < columns) {
    const cell = grid[r]?.[c];

    if (cell) {
      return { element: cell, row: r, col: c };
    }

    r += dRow;
    c += dCol;
  }

  return null;
}
