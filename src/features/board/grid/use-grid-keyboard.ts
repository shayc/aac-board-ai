import type { DOMAttributes, FocusEvent, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { useKeyboard } from "react-aria";

const CELL = "[role='gridcell']";
const FOCUSABLE = "[tabindex]";

export interface Cell {
  row: number;
  col: number;
}

export interface UseGridKeyboardOptions {
  grid: readonly (readonly unknown[])[];
  dir: "ltr" | "rtl";
}

export interface UseGridKeyboardReturn {
  rootRef: RefObject<HTMLDivElement | null>;
  rootProps: DOMAttributes<HTMLElement>;
  activeCell: Cell;
}

interface Step {
  row: -1 | 0 | 1;
  col: -1 | 0 | 1;
}

interface FocusTarget {
  element: HTMLElement;
  position: Cell;
}

interface KeyboardKey {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

export function useGridKeyboard({
  grid,
  dir,
}: UseGridKeyboardOptions): UseGridKeyboardReturn {
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeCell, setActiveCell] = useState<Cell>(() =>
    findFirstNonEmptyCell(grid),
  );
  const activeCellRef = useRef(activeCell);
  const updateActiveCell = (next: Cell) => {
    activeCellRef.current = next;
    setActiveCell(next);
  };

  const { keyboardProps } = useKeyboard({
    onKeyDown: (event) => {
      const root = rootRef.current;
      if (!root) {
        event.continuePropagation();

        return;
      }

      const from = cellOf(event.target as Element | null);
      if (!from) {
        event.continuePropagation();

        return;
      }

      const next = nextFocus(event, root, from, dir);
      if (!next || sameCell(next.position, from)) {
        event.continuePropagation();

        return;
      }

      event.preventDefault();
      updateActiveCell(next.position);
      next.element.focus();
    },
  });

  const onFocus = (event: FocusEvent<HTMLElement>) => {
    const position = cellOf(event.target);
    if (position) {
      updateActiveCell(position);
    }
  };

  const previousGridRef = useRef(grid);
  useEffect(() => {
    if (previousGridRef.current === grid) {
      return;
    }

    previousGridRef.current = grid;

    if (document.activeElement !== document.body) {
      return;
    }

    const root = rootRef.current;
    if (!root) {
      return;
    }

    const { row, col } = activeCellRef.current;
    const sameCellElement = root.querySelector<HTMLElement>(
      `${CELL}[aria-rowindex='${row + 1}'][aria-colindex='${col + 1}'] ${FOCUSABLE}`,
    );

    if (sameCellElement) {
      sameCellElement.focus();

      return;
    }

    const firstFocusable = root.querySelector<HTMLElement>(
      `${CELL} ${FOCUSABLE}`,
    );
    firstFocusable?.focus();
  }, [grid]);

  const tabStopCell = grid[activeCell.row]?.[activeCell.col]
    ? activeCell
    : findFirstNonEmptyCell(grid);

  return {
    rootRef,
    rootProps: { ...keyboardProps, onFocus },
    activeCell: tabStopCell,
  };
}

function findFirstNonEmptyCell(grid: readonly (readonly unknown[])[]): Cell {
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col]) {
        return { row, col };
      }
    }
  }

  return { row: 0, col: 0 };
}

function nextFocus(
  event: KeyboardKey,
  root: HTMLElement,
  from: Cell,
  dir: "ltr" | "rtl",
): FocusTarget | null {
  if (event.key === "Home" || event.key === "End") {
    if (event.shiftKey || event.altKey) {
      return null;
    }

    const wholeGrid = event.ctrlKey || event.metaKey;
    const scope = wholeGrid ? CELL : `${CELL}[aria-rowindex='${from.row + 1}']`;
    const candidates = root.querySelectorAll<HTMLElement>(
      `${scope} ${FOCUSABLE}`,
    );

    const goToFirst =
      dir === "rtl" ? event.key === "End" : event.key === "Home";

    const element = goToFirst
      ? candidates[0]
      : candidates[candidates.length - 1];

    if (!element) {
      return null;
    }

    const position = cellOf(element);

    return position ? { element, position } : null;
  }

  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
    return null;
  }

  const step = arrowStep(event.key, dir);

  return step ? nearestInDirection(root, from, step) : null;
}

function arrowStep(key: string, dir: "ltr" | "rtl"): Step | null {
  const rtl = dir === "rtl";
  switch (key) {
    case "ArrowUp":
      return { row: -1, col: 0 };
    case "ArrowDown":
      return { row: 1, col: 0 };
    case "ArrowLeft":
      return { row: 0, col: rtl ? 1 : -1 };
    case "ArrowRight":
      return { row: 0, col: rtl ? -1 : 1 };
    default:
      return null;
  }
}

function nearestInDirection(
  root: HTMLElement,
  from: Cell,
  step: Step,
): FocusTarget | null {
  let best: { target: FocusTarget; primary: number; cross: number } | null =
    null;

  for (const cell of root.querySelectorAll<HTMLElement>(CELL)) {
    const position = positionOf(cell);
    const element = cell.querySelector<HTMLElement>(FOCUSABLE);
    if (!position || !element) {
      continue;
    }

    const onRowAxis = step.row !== 0;
    const dPrimary = onRowAxis
      ? position.row - from.row
      : position.col - from.col;
    const dCross = onRowAxis
      ? position.col - from.col
      : position.row - from.row;
    if (Math.sign(dPrimary) !== (onRowAxis ? step.row : step.col)) {
      continue;
    }

    const primary = Math.abs(dPrimary);
    const cross = Math.abs(dCross);
    if (
      !best ||
      cross < best.cross ||
      (cross === best.cross && primary < best.primary)
    ) {
      best = { target: { element, position }, primary, cross };
    }
  }

  return best?.target ?? null;
}

function cellOf(target: Element | null): Cell | null {
  return positionOf(target?.closest(CELL) ?? null);
}

function positionOf(cell: Element | null): Cell | null {
  if (!cell) {
    return null;
  }

  const row = Number.parseInt(cell.getAttribute("aria-rowindex") ?? "", 10) - 1;
  const col = Number.parseInt(cell.getAttribute("aria-colindex") ?? "", 10) - 1;
  if (Number.isNaN(row) || Number.isNaN(col)) {
    return null;
  }

  return { row, col };
}

function sameCell(a: Cell, b: Cell): boolean {
  return a.row === b.row && a.col === b.col;
}
