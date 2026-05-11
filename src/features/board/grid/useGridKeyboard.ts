import type { FocusEvent, RefObject } from "react";
import { useState } from "react";
import { useKeyboard } from "react-aria";

interface GridCell {
  row: number;
  col: number;
}

export interface UseGridKeyboardOptions {
  gridRef: RefObject<HTMLElement | null>;
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
  defaultActiveCell = { row: 0, col: 0 },
}: UseGridKeyboardOptions): UseGridKeyboardReturn {
  const [activeCell, setActiveCell] = useState<GridCell>(defaultActiveCell);

  const { keyboardProps } = useKeyboard({
    onKeyDown: (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
        event.continuePropagation();
        return;
      }

      const grid = gridRef.current;
      if (!grid) {
        event.continuePropagation();
        return;
      }

      const cell = (event.target as HTMLElement).closest<HTMLElement>(
        "[role='gridcell']",
      );
      if (!cell) {
        event.continuePropagation();
        return;
      }

      const currentRow =
        parseInt(cell.getAttribute("aria-rowindex") ?? "", 10) - 1;
      const currentCol =
        parseInt(cell.getAttribute("aria-colindex") ?? "", 10) - 1;

      if (isNaN(currentRow) || isNaN(currentCol)) {
        event.continuePropagation();
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
          event.continuePropagation();
          return;
      }

      const result = findNextNonEmptyCell(
        grid,
        currentRow,
        currentCol,
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
  currentRow: number,
  currentCol: number,
  deltaRow: number,
  deltaCol: number,
): CellResult | null {
  const cells = grid.querySelectorAll<HTMLElement>("[role='gridcell']");

  let best: (CellResult & { primary: number; perp: number }) | null = null;

  for (const cell of cells) {
    const row = parseInt(cell.getAttribute("aria-rowindex") ?? "", 10) - 1;
    const col = parseInt(cell.getAttribute("aria-colindex") ?? "", 10) - 1;
    if (isNaN(row) || isNaN(col)) {
      continue;
    }

    const focusable = cell.querySelector<HTMLElement>("[tabindex]");
    if (!focusable) {
      continue;
    }

    const dr = row - currentRow;
    const dc = col - currentCol;

    // Reject cells that aren't in the arrow's half-plane. Primary axis is the
    // arrow's axis; perp axis is the other one. When no in-line tile exists,
    // ranking by (perp, primary) prefers the most-aligned diagonal hop.
    let primary: number;
    let perp: number;
    if (deltaRow !== 0) {
      if (Math.sign(dr) !== deltaRow) {
        continue;
      }
      primary = Math.abs(dr);
      perp = Math.abs(dc);
    } else {
      if (Math.sign(dc) !== deltaCol) {
        continue;
      }
      primary = Math.abs(dc);
      perp = Math.abs(dr);
    }

    if (
      !best ||
      perp < best.perp ||
      (perp === best.perp && primary < best.primary)
    ) {
      best = { element: focusable, row, col, primary, perp };
    }
  }

  return best ? { element: best.element, row: best.row, col: best.col } : null;
}
