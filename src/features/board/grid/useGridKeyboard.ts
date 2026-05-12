import type { FocusEvent, RefObject } from "react";
import { useState } from "react";
import { useKeyboard } from "react-aria";

interface GridPosition {
  row: number;
  col: number;
}

export interface UseGridKeyboardOptions {
  gridRef: RefObject<HTMLElement | null>;
  initialActiveCell?: GridPosition;
}

export interface UseGridKeyboardReturn {
  keyboardProps: ReturnType<typeof useKeyboard>["keyboardProps"];
  activeCell: GridPosition;
  handleFocus: (event: FocusEvent<HTMLElement>) => void;
}

interface FocusableCell {
  element: HTMLElement;
  row: number;
  col: number;
}

export function useGridKeyboard({
  gridRef,
  initialActiveCell = { row: 0, col: 0 },
}: UseGridKeyboardOptions): UseGridKeyboardReturn {
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

      const result = findNextFocusableCell(
        grid,
        currentRow,
        currentCol,
        rowDirection,
        colDirection,
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

function findNextFocusableCell(
  grid: HTMLElement,
  currentRow: number,
  currentCol: number,
  rowDirection: number,
  colDirection: number,
): FocusableCell | null {
  const cells = grid.querySelectorAll<HTMLElement>("[role='gridcell']");

  let best: (FocusableCell & { primary: number; perp: number }) | null = null;

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
    if (rowDirection !== 0) {
      if (Math.sign(dr) !== rowDirection) {
        continue;
      }
      primary = Math.abs(dr);
      perp = Math.abs(dc);
    } else {
      if (Math.sign(dc) !== colDirection) {
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
