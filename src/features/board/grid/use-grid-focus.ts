import type { DOMAttributes, FocusEvent, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { useKeyboard } from "react-aria";
import {
  findFirstGridFocusable,
  findGridFocusableAt,
  findGridPosition,
} from "./grid-dom";
import { findGridKeyTarget } from "./grid-key-navigation";
import {
  findFirstOccupiedPosition,
  isSameGridPosition,
  type GridPosition,
} from "./grid-model";

interface UseGridFocusReturn {
  rootRef: RefObject<HTMLDivElement | null>;
  rootProps: DOMAttributes<HTMLElement>;
  tabStopPosition: GridPosition;
}

export function useGridFocus(
  grid: readonly (readonly unknown[])[],
  contentKey: string | undefined,
): UseGridFocusReturn {
  const rootRef = useRef<HTMLDivElement>(null);
  const [rememberedPosition, setRememberedPosition] = useState<GridPosition>(
    () => findFirstOccupiedPosition(grid),
  );
  const rememberedPositionRef = useRef(rememberedPosition);

  function rememberPosition(next: GridPosition) {
    rememberedPositionRef.current = next;
    setRememberedPosition(next);
  }

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

      const direction = root.matches(":dir(rtl)") ? "rtl" : "ltr";
      const next = findGridKeyTarget(event, root, from, direction);
      if (!next || isSameGridPosition(next.position, from)) {
        event.continuePropagation();

        return;
      }

      event.preventDefault();
      rememberPosition(next.position);
      next.element.focus();
    },
  });

  function handleFocus(event: FocusEvent<HTMLElement>) {
    const position = findGridPosition(event.target);
    if (position) {
      rememberPosition(position);
    }
  }

  const previousContentKeyRef = useRef(contentKey);
  useEffect(() => {
    if (previousContentKeyRef.current === contentKey) {
      return;
    }

    previousContentKeyRef.current = contentKey;

    if (document.activeElement !== document.body) {
      return;
    }

    const root = rootRef.current;
    if (!root) {
      return;
    }

    const target =
      findGridFocusableAt(root, rememberedPositionRef.current) ??
      findFirstGridFocusable(root);
    target?.focus();
  }, [contentKey]);

  const tabStopPosition = grid[rememberedPosition.row]?.[
    rememberedPosition.column
  ]
    ? rememberedPosition
    : findFirstOccupiedPosition(grid);

  return {
    rootRef,
    rootProps: { ...keyboardProps, onFocus: handleFocus },
    tabStopPosition,
  };
}
