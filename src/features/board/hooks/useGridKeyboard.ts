import type { RefObject } from "react";
import { useKeyboard } from "react-aria";

interface UseGridKeyboardOptions {
  cellRefs: RefObject<(HTMLElement | null)[][]>;
  rows: number;
  columns: number;
}

export function useGridKeyboard({
  cellRefs,
  rows,
  columns,
}: UseGridKeyboardOptions) {
  const { keyboardProps } = useKeyboard({
    onKeyDown: (event) => {
      const grid = cellRefs.current;
      if (!grid) {
        return;
      }

      // O(1) lookup
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

      let targetRow = currentRow;
      let targetCol = currentCol;

      switch (event.key) {
        case "ArrowUp":
          targetRow = currentRow - 1;
          break;
        case "ArrowDown":
          targetRow = currentRow + 1;
          break;
        case "ArrowLeft":
          targetCol = currentCol - 1;
          break;
        case "ArrowRight":
          targetCol = currentCol + 1;
          break;
        default:
          return;
      }

      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
        return;
      }

      const nextCell = findNextNonEmptyCell(
        grid,
        targetRow,
        targetCol,
        rows,
        columns,
        event.key,
      );

      if (nextCell) {
        event.preventDefault();
        nextCell.focus();
      }
    },
  });

  return { keyboardProps };
}

function findNextNonEmptyCell(
  grid: (HTMLElement | null)[][],
  targetRow: number,
  targetCol: number,
  rows: number,
  columns: number,
  key: string,
): HTMLElement | null {
  if (
    targetRow < 0 ||
    targetRow >= rows ||
    targetCol < 0 ||
    targetCol >= columns
  ) {
    return null;
  }

  let r = targetRow;
  let c = targetCol;

  while (r >= 0 && r < rows && c >= 0 && c < columns) {
    const cell = grid[r]?.[c];
    if (cell) {
      return cell;
    }

    switch (key) {
      case "ArrowUp":
        r--;
        break;
      case "ArrowDown":
        r++;
        break;
      case "ArrowLeft":
        c--;
        break;
      case "ArrowRight":
        c++;
        break;
    }
  }

  return null;
}
