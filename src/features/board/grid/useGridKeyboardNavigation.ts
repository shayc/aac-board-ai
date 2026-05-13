import type { FocusEvent, RefObject } from "react";
import { useState } from "react";
import { useKeyboard } from "react-aria";

const CELL = "[role='gridcell']";
const FOCUSABLE = "[tabindex]";

export interface Cell {
  row: number;
  col: number;
}

export interface UseGridKeyboardNavigationOptions {
  gridRef: RefObject<HTMLElement | null>;
  initialActiveCell?: Cell;
  dir?: "ltr" | "rtl";
}

export function useGridKeyboardNavigation({
  gridRef,
  initialActiveCell = { row: 0, col: 0 },
  dir = "ltr",
}: UseGridKeyboardNavigationOptions) {
  const [activeCell, setActiveCell] = useState<Cell>(initialActiveCell);

  const { keyboardProps } = useKeyboard({
    onKeyDown: (event) => {
      const grid = gridRef.current;
      if (!grid) {
        return;
      }

      const from = cellOf(event.target as Element | null);
      if (!from) {
        return;
      }

      const next = nextFocus(event, grid, from, dir);
      // Don't preventDefault when we didn't move: let the key reach the
      // browser / other handlers (e.g. Home/End at the row boundary).
      if (!next || sameCell(next.position, from)) {
        return;
      }

      event.preventDefault();
      setActiveCell(next.position);
      next.element.focus();
    },
  });

  const onFocus = (event: FocusEvent<HTMLElement>) => {
    const position = cellOf(event.target);
    if (position) {
      setActiveCell(position);
    }
  };

  return { rootProps: { ...keyboardProps, onFocus }, activeCell };
}

// --- internals ---

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

function nextFocus(
  event: KeyboardKey,
  grid: HTMLElement,
  from: Cell,
  dir: "ltr" | "rtl",
): FocusTarget | null {
  if (event.key === "Home" || event.key === "End") {
    if (event.shiftKey || event.altKey) {
      return null;
    }
    const wholeGrid = event.ctrlKey || event.metaKey;
    const scope = wholeGrid ? CELL : `${CELL}[aria-rowindex='${from.row + 1}']`;
    const candidates = grid.querySelectorAll<HTMLElement>(
      `${scope} ${FOCUSABLE}`,
    );

    // Home/End follow the visual direction of the physical arrow key so
    // they stay consistent with ArrowLeft/ArrowRight. On macOS Fn+ArrowLeft
    // sends Home and Fn+Ctrl+ArrowLeft sends Ctrl+Home; both should move
    // toward the visual-left edge regardless of writing direction. Because
    // ArrowLeft is the "end" direction in RTL, Home there picks the last
    // cell in reading order (DOM order), and End picks the first.
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
  return step ? nearestInDirection(grid, from, step) : null;
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

// Among cells in the step's half-plane, prefer the most in-line tile
// (smallest cross-axis distance), then the closest along the primary axis.
function nearestInDirection(
  grid: HTMLElement,
  from: Cell,
  step: Step,
): FocusTarget | null {
  let best: { target: FocusTarget; primary: number; cross: number } | null =
    null;

  for (const cell of grid.querySelectorAll<HTMLElement>(CELL)) {
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
