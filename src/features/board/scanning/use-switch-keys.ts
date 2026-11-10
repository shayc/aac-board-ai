import { useEffect, useEffectEvent, type RefObject } from "react";
import { isScanScopeCovered } from "./scan-targets";

/**
 * Reports presses of the switch keys in `keyActions`. A switch key counts
 * wherever keyboard focus is, because focus often rests outside the scope,
 * such as on the button that opened a drawer that has since closed. Keys
 * typed into a text field are left alone, and so are keys pressed while a
 * dialog, drawer, or menu covers the scope.
 */
export function useSwitchKeys<Action>(
  scopeRef: RefObject<HTMLElement | null>,
  keyActions: ReadonlyMap<string, Action>,
  onPress: (action: Action) => void,
): void {
  const handlePress = useEffectEvent(onPress);

  useEffect(() => {
    function findAction(event: KeyboardEvent): Action | undefined {
      const scope = scopeRef.current;
      if (!scope || isScanScopeCovered(scope)) {
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
