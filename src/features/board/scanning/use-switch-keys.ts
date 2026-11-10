import { useEffect, useEffectEvent, type RefObject } from "react";

/**
 * Reports presses of the switch keys in `keyActions`. A switch key counts
 * while keyboard focus is inside the scope or nowhere, so switches work
 * without focusing the board first, and keys typed in dialogs are left alone.
 */
export function useSwitchKeys<Action>(
  scopeRef: RefObject<HTMLElement | null>,
  keyActions: ReadonlyMap<string, Action>,
  onPress: (action: Action) => void,
): void {
  const handlePress = useEffectEvent(onPress);

  useEffect(() => {
    function findAction(event: KeyboardEvent): Action | undefined {
      const hasModifier = event.ctrlKey || event.metaKey || event.altKey;
      if (hasModifier || !isInScope(event.target, scopeRef.current)) {
        return undefined;
      }

      return keyActions.get(event.key);
    }

    function handleKeyDown(event: KeyboardEvent) {
      const action = findAction(event);
      if (action === undefined) {
        return;
      }

      claimKey(event);

      // A held switch repeats its key; only the press itself counts.
      if (!event.repeat) {
        handlePress(action);
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (findAction(event) !== undefined) {
        claimKey(event);
      }
    }

    // Capturing at the document runs before the focused control's own handlers.
    const options = { capture: true };
    document.addEventListener("keydown", handleKeyDown, options);
    document.addEventListener("keyup", handleKeyUp, options);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, options);
      document.removeEventListener("keyup", handleKeyUp, options);
    };
  }, [scopeRef, keyActions]);
}

function isInScope(
  target: EventTarget | null,
  scope: HTMLElement | null,
): boolean {
  return (
    target === document.body ||
    (target instanceof Node && scope !== null && scope.contains(target))
  );
}

/** Keeps a switch key from also activating the control that has focus. */
function claimKey(event: KeyboardEvent): void {
  event.preventDefault();
  event.stopPropagation();
}
