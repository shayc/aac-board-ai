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
    onKeyDown: (e) => {
      const grid = cellRefs.current;
      if (!grid) return;

      const activeElement = document.activeElement;
      let currentRow = -1;
      let currentCol = -1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
          if (grid[r]?.[c] === activeElement) {
            currentRow = r;
            currentCol = c;
            break;
          }
        }
        if (currentRow !== -1) break;
      }

      if (currentRow === -1 || currentCol === -1) return;

      let targetRow = currentRow;
      let targetCol = currentCol;

      switch (e.key) {
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

      const nextCell = findNextNonEmptyCell(
        grid,
        targetRow,
        targetCol,
        rows,
        columns,
        e.key,
      );

      if (nextCell) {
        e.preventDefault();
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
