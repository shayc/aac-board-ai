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
  findFirstGridFocusable,
  findGridFocusableAt,
  findGridPosition,
} from "./grid-dom";
import { findGridKeyTarget } from "./grid-key-navigation";
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
      const root = rootRef.current;
      const next = root ? findGridKeyTarget(event, root) : null;
      if (!next) {
        event.continuePropagation();

        return;
      }

      event.preventDefault();
      next.element.focus();
    },
  });

  function handleFocus(event: FocusEvent<HTMLElement>) {
    const position = findGridPosition(event.target);
    if (position) {
      setRememberedPosition((remembered) =>
        isSameGridPosition(remembered, position) ? remembered : position,
      );
    }
  }

  const restoreLostFocus = useEffectEvent(() => {
    if (document.activeElement !== document.body) {
      return;
    }

    const root = rootRef.current;
    if (!root) {
      return;
    }

    const target =
      findGridFocusableAt(root, rememberedPosition) ??
      findFirstGridFocusable(root);
    target?.focus();
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

  const rememberedCell =
    grid[rememberedPosition.row]?.[rememberedPosition.column];
  const tabStopPosition = rememberedCell
    ? rememberedPosition
    : findFirstOccupiedPosition(grid);

  return {
    rootRef,
    rootProps: { ...keyboardProps, onFocus: handleFocus },
    tabStopPosition,
  };
}
