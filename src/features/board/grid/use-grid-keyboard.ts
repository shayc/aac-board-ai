import type { DOMAttributes, FocusEvent, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { useKeyboard } from "react-aria";
import {
  findFirstGridFocusable,
  findFocusableInGridPosition,
  findGridPosition,
  isSameGridPosition,
} from "./grid-dom";
import { findGridKeyTarget } from "./grid-key-navigation";
import { findFirstOccupiedPosition, type GridPosition } from "./grid-model";

interface UseGridKeyboardOptions {
  grid: readonly (readonly unknown[])[];
  dir: "ltr" | "rtl";
}

interface UseGridKeyboardReturn {
  rootRef: RefObject<HTMLDivElement | null>;
  rootProps: DOMAttributes<HTMLElement>;
  activeCell: GridPosition;
}

export function useGridKeyboard({
  grid,
  dir,
}: UseGridKeyboardOptions): UseGridKeyboardReturn {
  const rootRef = useRef<HTMLDivElement>(null);
  const [rememberedPosition, setRememberedPosition] = useState<GridPosition>(
    () => findFirstOccupiedPosition(grid),
  );
  const rememberedPositionRef = useRef(rememberedPosition);
  const rememberPosition = (next: GridPosition) => {
    rememberedPositionRef.current = next;
    setRememberedPosition(next);
  };

  const { keyboardProps } = useKeyboard({
    onKeyDown: (event) => {
      const root = rootRef.current;
      if (!root) {
        event.continuePropagation();

        return;
      }

      const from = findGridPosition(event.target as Element | null);
      if (!from) {
        event.continuePropagation();

        return;
      }

      const next = findGridKeyTarget(event, root, from, dir);
      if (!next || isSameGridPosition(next.position, from)) {
        event.continuePropagation();

        return;
      }

      event.preventDefault();
      rememberPosition(next.position);
      next.element.focus();
    },
  });

  const handleFocus = (event: FocusEvent<HTMLElement>) => {
    const position = findGridPosition(event.target);
    if (position) {
      rememberPosition(position);
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

    const target =
      findFocusableInGridPosition(root, rememberedPositionRef.current) ??
      findFirstGridFocusable(root);
    target?.focus();
  }, [grid]);

  const activeCell = grid[rememberedPosition.row]?.[rememberedPosition.col]
    ? rememberedPosition
    : findFirstOccupiedPosition(grid);

  return {
    rootRef,
    rootProps: { ...keyboardProps, onFocus: handleFocus },
    activeCell,
  };
}
