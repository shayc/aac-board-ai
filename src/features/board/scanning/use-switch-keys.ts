import { useEffect, useEffectEvent, type RefObject } from "react";
import { isScanningScopeCovered } from "./scan-targets";

export function useSwitchKeys<Action>(
  scopeRef: RefObject<HTMLElement | null>,
  keyActions: ReadonlyMap<string, Action>,
  onPress: (action: Action) => void,
): void {
  const handlePress = useEffectEvent(onPress);

  useEffect(() => {
    function findAction(event: KeyboardEvent): Action | undefined {
      const scope = scopeRef.current;
      if (!scope || isScanningScopeCovered(scope)) {
        return undefined;
      }

      const hasModifier = event.ctrlKey || event.metaKey || event.altKey;
      if (hasModifier || isTextEntry(event)) {
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

      if (!event.repeat) {
        handlePress(action);
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (findAction(event) !== undefined) {
        claimKey(event);
      }
    }

    // Focus can remain outside the scope after a drawer closes.
    const options = { capture: true };
    document.addEventListener("keydown", handleKeyDown, options);
    document.addEventListener("keyup", handleKeyUp, options);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, options);
      document.removeEventListener("keyup", handleKeyUp, options);
    };
  }, [scopeRef, keyActions]);
}

function isTextEntry(event: KeyboardEvent): boolean {
  const { target } = event;

  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.matches("input, textarea, select"))
  );
}

/** Keeps a switch key from also activating the control that has focus. */
function claimKey(event: KeyboardEvent): void {
  event.preventDefault();
  event.stopPropagation();
}
