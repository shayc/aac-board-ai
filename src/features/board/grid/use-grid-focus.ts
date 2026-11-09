import type { DOMAttributes, FocusEvent, RefObject } from "react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useKeyboard } from "react-aria";
import {
  findFirstGridFocusable,
  findGridFocusableAt,
  findGridPosition,
} from "./grid-dom";
import { findGridKeyTarget } from "./grid-key-navigation";
import { findFirstOccupiedPosition, type GridPosition } from "./grid-model";

interface UseGridFocusReturn {
  rootRef: RefObject<HTMLDivElement | null>;
  rootProps: DOMAttributes<HTMLElement>;
  tabStopPosition: GridPosition;
}

export function useGridFocus(
  grid: readonly (readonly unknown[])[],
): UseGridFocusReturn {
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
      setRememberedPosition(next.position);
      next.element.focus();
    },
  });

  function handleFocus(event: FocusEvent<HTMLElement>) {
    const position = findGridPosition(event.target);
    if (position) {
      setRememberedPosition(position);
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

  const previousGridRef = useRef(grid);
  useEffect(() => {
    if (previousGridRef.current === grid) {
      return;
    }

    previousGridRef.current = grid;
    restoreLostFocus();
  }, [grid]);

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
