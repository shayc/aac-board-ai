import {
  type DOMAttributes,
  type FocusEvent,
  type RefObject,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { useKeyboard } from "react-aria";
import {
  findFirstOccupiedPosition,
  type GridCells,
  gridCellsKey,
  type GridPosition,
  isSameGridPosition,
} from "./grid-cells";
import { findGridKeyTarget, type GridKeyEvent } from "./grid-key-navigation";

const GRID_CELL_SELECTOR = "[role='gridcell']";
const GRID_FOCUSABLE_SELECTOR = "[tabindex]";

interface UseGridFocusReturn {
  rootRef: RefObject<HTMLDivElement | null>;
  rootProps: DOMAttributes<HTMLElement>;
  tabStopPosition: GridPosition;
}

export function useGridFocus<Item extends object>(
  cells: GridCells<Item>,
  getItemKey: (item: Item) => string,
): UseGridFocusReturn {
  const rootRef = useRef<HTMLDivElement>(null);
  const [rememberedPosition, setRememberedPosition] = useState<GridPosition>(
    () => findFirstOccupiedPosition(cells),
  );

  const { keyboardProps } = useKeyboard({
    onKeyDown: (event) => {
      const next = findKeyTargetElement(rootRef.current, cells, event);
      if (!next) {
        event.continuePropagation();

        return;
      }

      event.preventDefault();
      next.focus();
    },
  });

  const rememberedCell =
    cells[rememberedPosition.row]?.[rememberedPosition.column];
  const tabStopPosition = rememberedCell
    ? rememberedPosition
    : findFirstOccupiedPosition(cells);

  const restoreLostFocus = useEffectEvent(() => {
    if (document.activeElement !== document.body) {
      return;
    }

    const root = rootRef.current;
    const tabStop = root && findGridFocusableAt(root, tabStopPosition);
    tabStop?.focus();
  });

  // Depending on the array itself would restore focus on renders that only rebuild it.
  const cellsKey = gridCellsKey(cells, getItemKey);
  const previousCellsKeyRef = useRef(cellsKey);
  useEffect(() => {
    if (previousCellsKeyRef.current === cellsKey) {
      return;
    }

    previousCellsKeyRef.current = cellsKey;
    restoreLostFocus();
  }, [cellsKey]);

  function handleFocus(event: FocusEvent<HTMLElement>) {
    const position = findGridPosition(event.target);
    if (position) {
      setRememberedPosition((remembered) =>
        isSameGridPosition(remembered, position) ? remembered : position,
      );
    }
  }

  return {
    rootRef,
    rootProps: { ...keyboardProps, onFocus: handleFocus },
    tabStopPosition,
  };
}

interface TargetedGridKeyEvent extends GridKeyEvent {
  target: EventTarget | null;
}

function findKeyTargetElement(
  root: HTMLElement | null,
  cells: GridCells,
  event: TargetedGridKeyEvent,
): HTMLElement | null {
  const from = findGridPosition(event.target);
  if (!root || !from) {
    return null;
  }

  const direction = root.matches(":dir(rtl)") ? "rtl" : "ltr";
  const target = findGridKeyTarget(cells, from, event, direction);

  return target && findGridFocusableAt(root, target);
}

function findGridPosition(target: EventTarget | null): GridPosition | null {
  if (!(target instanceof Element)) {
    return null;
  }

  const cell = target.closest(GRID_CELL_SELECTOR);
  if (!cell) {
    return null;
  }

  const row = Number.parseInt(cell.getAttribute("aria-rowindex") ?? "", 10) - 1;
  const column =
    Number.parseInt(cell.getAttribute("aria-colindex") ?? "", 10) - 1;
  if (Number.isNaN(row) || Number.isNaN(column)) {
    return null;
  }

  return { row, column };
}

function findGridFocusableAt(
  root: HTMLElement,
  position: GridPosition,
): HTMLElement | null {
  return root.querySelector<HTMLElement>(
    `${GRID_CELL_SELECTOR}[aria-rowindex='${position.row + 1}'][aria-colindex='${position.column + 1}'] ${GRID_FOCUSABLE_SELECTOR}`,
  );
}
