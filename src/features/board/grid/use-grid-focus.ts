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
import { findGridFocusableAt, findGridPosition } from "./grid-dom";
import { findGridKeyTarget, type GridKeyEvent } from "./grid-key-navigation";
import {
  findFirstOccupiedPosition,
  gridArrangementKey,
  type GridCells,
  type GridPosition,
  isSameGridPosition,
} from "./grid-model";

interface UseGridFocusReturn {
  rootRef: RefObject<HTMLDivElement | null>;
  rootProps: DOMAttributes<HTMLElement>;
  tabStopPosition: GridPosition;
}

export function useGridFocus(grid: GridCells): UseGridFocusReturn {
  const rootRef = useRef<HTMLDivElement>(null);
  const [rememberedPosition, setRememberedPosition] = useState<GridPosition>(
    () => findFirstOccupiedPosition(grid),
  );

  const { keyboardProps } = useKeyboard({
    onKeyDown: (event) => {
      const next = findKeyTargetElement(rootRef.current, grid, event);
      if (!next) {
        event.continuePropagation();

        return;
      }

      event.preventDefault();
      next.focus();
    },
  });

  const rememberedCell =
    grid[rememberedPosition.row]?.[rememberedPosition.column];
  const tabStopPosition = rememberedCell
    ? rememberedPosition
    : findFirstOccupiedPosition(grid);

  const restoreLostFocus = useEffectEvent(() => {
    if (document.activeElement !== document.body) {
      return;
    }

    const root = rootRef.current;
    const tabStop = root && findGridFocusableAt(root, tabStopPosition);
    tabStop?.focus();
  });

  // A focused tile drops focus to the body only when it unmounts, which takes
  // a change in which tile sits where; the grid array itself is new each render.
  const arrangementKey = gridArrangementKey(grid);
  const previousArrangementKeyRef = useRef(arrangementKey);
  useEffect(() => {
    if (previousArrangementKeyRef.current === arrangementKey) {
      return;
    }

    previousArrangementKeyRef.current = arrangementKey;
    restoreLostFocus();
  }, [arrangementKey]);

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
  grid: GridCells,
  event: TargetedGridKeyEvent,
): HTMLElement | null {
  const from = findGridPosition(event.target);
  if (!root || !from) {
    return null;
  }

  const direction = root.matches(":dir(rtl)") ? "rtl" : "ltr";
  const target = findGridKeyTarget(grid, from, event, direction);

  return target && findGridFocusableAt(root, target);
}
