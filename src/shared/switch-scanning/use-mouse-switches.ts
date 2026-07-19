import type { Scanner } from "@shayc/switch-scanning/react/advanced";
import { useEffect } from "react";

interface UseMouseSwitchesOptions {
  enabled: boolean;
  shouldHandle: (event: MouseEvent) => boolean;
}

function claimEvent(event: MouseEvent): void {
  event.preventDefault();
  event.stopPropagation();
}

function getSourceId(button: number): string {
  return `mouse:${button}`;
}

export function useMouseSwitches(
  scanner: Scanner,
  bindings: Readonly<Record<number, string>>,
  { enabled, shouldHandle }: UseMouseSwitchesOptions,
): void {
  useEffect(() => {
    const heldButtons = new Map<number, string>();
    const completedButtons = new Set<number>();

    function onMouseDown(event: MouseEvent): void {
      const switchId = bindings[event.button];

      if (!enabled || !switchId || !shouldHandle(event)) {
        return;
      }

      claimEvent(event);

      if (heldButtons.has(event.button)) {
        return;
      }

      heldButtons.set(event.button, switchId);
      scanner.input.press(switchId, getSourceId(event.button));
    }

    function onMouseUp(event: MouseEvent): void {
      const switchId = heldButtons.get(event.button);

      if (!switchId) {
        return;
      }

      claimEvent(event);
      scanner.input.release(switchId, getSourceId(event.button));
      heldButtons.delete(event.button);
      completedButtons.add(event.button);
    }

    function onClick(event: MouseEvent): void {
      if (event.detail === 0) {
        return;
      }

      const switchId = bindings[event.button];
      const completedPress = completedButtons.delete(event.button);

      if (!enabled || !switchId || (!completedPress && !shouldHandle(event))) {
        return;
      }

      claimEvent(event);

      if (!completedPress) {
        const sourceId = getSourceId(event.button);

        scanner.input.press(switchId, sourceId);
        scanner.input.release(switchId, sourceId);
      }
    }

    function onContextMenu(event: MouseEvent): void {
      if (
        enabled &&
        bindings[2] &&
        (completedButtons.has(2) || shouldHandle(event))
      ) {
        claimEvent(event);
        completedButtons.delete(2);
      }
    }

    function suspendInput(): void {
      heldButtons.clear();
      completedButtons.clear();
      scanner.input.suspend();
    }

    function onVisibilityChange(): void {
      if (document.visibilityState === "hidden") {
        suspendInput();
      }
    }

    document.addEventListener("mousedown", onMouseDown, true);
    document.addEventListener("mouseup", onMouseUp, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("auxclick", onClick, true);
    document.addEventListener("contextmenu", onContextMenu, true);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", suspendInput);

    return () => {
      for (const [button] of heldButtons) {
        scanner.input.disconnect(getSourceId(button));
      }

      document.removeEventListener("mousedown", onMouseDown, true);
      document.removeEventListener("mouseup", onMouseUp, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("auxclick", onClick, true);
      document.removeEventListener("contextmenu", onContextMenu, true);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", suspendInput);
    };
  }, [bindings, enabled, scanner, shouldHandle]);
}
