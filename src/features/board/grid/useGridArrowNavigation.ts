import type { FocusEvent, RefObject } from "react";
import { useState } from "react";
import { useKeyboard } from "react-aria";

interface GridPosition {
  row: number;
  col: number;
}

export interface UseGridArrowNavigationOptions {
  gridRef: RefObject<HTMLElement | null>;
  initialActiveCell?: GridPosition;
}

export interface UseGridArrowNavigationReturn {
  keyboardProps: ReturnType<typeof useKeyboard>["keyboardProps"];
  activeCell: GridPosition;
  handleFocus: (event: FocusEvent<HTMLElement>) => void;
}

interface FocusableCell {
  element: HTMLElement;
  row: number;
  col: number;
}

export function useGridArrowNavigation({
  gridRef,
  initialActiveCell = { row: 0, col: 0 },
}: UseGridArrowNavigationOptions): UseGridArrowNavigationReturn {
  const [activeCell, setActiveCell] = useState<GridPosition>(initialActiveCell);

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

      let rowDirection = 0;
      let colDirection = 0;

      switch (event.key) {
        case "ArrowUp":
          rowDirection = -1;
          break;
        case "ArrowDown":
          rowDirection = 1;
          break;
        case "ArrowLeft":
          colDirection = -1;
          break;
        case "ArrowRight":
          colDirection = 1;
          break;
        default:
          return;
      }

      const nextCell = findNextFocusableCell(
        grid,
        currentRow,
        currentCol,
        rowDirection,
        colDirection,
      );

      if (nextCell) {
        event.preventDefault();
        setActiveCell({ row: nextCell.row, col: nextCell.col });
        nextCell.element.focus();
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

function findNextFocusableCell(
  grid: HTMLElement,
  currentRow: number,
  currentCol: number,
  rowDirection: number,
  colDirection: number,
): FocusableCell | null {
  const cells = grid.querySelectorAll<HTMLElement>("[role='gridcell']");

  let bestCandidate:
    | (FocusableCell & { primaryDist: number; perpDist: number })
    | null = null;

  for (const cell of cells) {
    const row = parseInt(cell.getAttribute("aria-rowindex") ?? "", 10) - 1;
    const col = parseInt(cell.getAttribute("aria-colindex") ?? "", 10) - 1;
    if (isNaN(row) || isNaN(col)) {
      continue;
    }

    const focusableElement = cell.querySelector<HTMLElement>("[tabindex]");
    if (!focusableElement) {
      continue;
    }

    const deltaRow = row - currentRow;
    const deltaCol = col - currentCol;

    // Reject cells that aren't in the arrow's half-plane. The primary axis is
    // the arrow's axis; the perp axis is the other one. When no in-line tile
    // exists, ranking by (perpDist, primaryDist) prefers the most-aligned
    // diagonal hop.
    let primaryDist: number;
    let perpDist: number;
    if (rowDirection !== 0) {
      if (Math.sign(deltaRow) !== rowDirection) {
        continue;
      }
      primaryDist = Math.abs(deltaRow);
      perpDist = Math.abs(deltaCol);
    } else {
      if (Math.sign(deltaCol) !== colDirection) {
        continue;
      }
      primaryDist = Math.abs(deltaCol);
      perpDist = Math.abs(deltaRow);
    }

    if (
      !bestCandidate ||
      perpDist < bestCandidate.perpDist ||
      (perpDist === bestCandidate.perpDist &&
        primaryDist < bestCandidate.primaryDist)
    ) {
      bestCandidate = {
        element: focusableElement,
        row,
        col,
        primaryDist,
        perpDist,
      };
    }
  }

  return bestCandidate
    ? {
        element: bestCandidate.element,
        row: bestCandidate.row,
        col: bestCandidate.col,
      }
    : null;
}
