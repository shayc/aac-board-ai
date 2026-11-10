import { flushSync } from "react-dom";
import {
  isFirstScanStep,
  nextScanState,
  PAUSED_SCAN,
  type ScanEvent,
  type ScanState,
} from "./scan-model";
import {
  findHighlightedElement,
  findScanGroups,
  findSelectedTarget,
  relocateScanState,
} from "./scan-targets";
import type { ScanningPreferences } from "./scanning-preferences-store";

export const SCAN_HIGHLIGHT_ATTRIBUTE = "data-scan-highlight";

const SWITCH_KEYS = [" ", "Enter"];
const EDITABLE_SELECTOR = "input, textarea, select, [contenteditable]";
const MS_PER_SECOND = 1000;

export interface SwitchScanner {
  /** Returns a running scan to the first group; a paused scan stays paused. */
  restart: () => void;
  stop: () => void;
}

/**
 * Scans the groups under `root` with one or two switches until stopped.
 * Space and Enter are the switches, the defaults of common switch interfaces.
 */
export function startSwitchScanner(
  root: HTMLElement,
  preferences: ScanningPreferences,
): SwitchScanner {
  let state: ScanState = PAUSED_SCAN;
  let highlighted: HTMLElement | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const lastPressTimes = new Map<string, number>();

  function readGroups() {
    return findScanGroups(root, preferences.pattern);
  }

  function show(nextState: ScanState) {
    const nextHighlighted = findHighlightedElement(nextState, readGroups());

    state = nextHighlighted ? nextState : PAUSED_SCAN;
    highlight(nextHighlighted);
    scheduleAutoStep();
  }

  function highlight(element: HTMLElement | undefined) {
    highlighted?.removeAttribute(SCAN_HIGHLIGHT_ATTRIBUTE);
    highlighted = element;
    element?.setAttribute(SCAN_HIGHLIGHT_ATTRIBUTE, "");
    element?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function scheduleAutoStep() {
    clearTimeout(timer);
    if (preferences.method !== "auto" || state.status === "paused") {
      return;
    }

    const firstItemDelay = isFirstScanStep(state)
      ? preferences.firstItemDelay
      : 0;
    const seconds = preferences.scanTime + firstItemDelay;

    timer = setTimeout(handleAutoStep, seconds * MS_PER_SECOND);
  }

  function handleAutoStep() {
    if (isBehindOverlay(root)) {
      show(PAUSED_SCAN);

      return;
    }

    handleScanEvent("next");
  }

  function handleScanEvent(event: ScanEvent) {
    const groups = readGroups();
    const step = nextScanState(
      relocateScanState(state, highlighted, groups),
      event,
      groups.map((group) => group.targets.length),
      preferences,
    );

    const target = step.selection && findSelectedTarget(step.selection, groups);
    if (target) {
      // The click can change the targets (the first word enables Play), so
      // React must commit before the scan restarts on the updated board.
      flushSync(() => target.click());
    }

    show(step.state);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (!isSwitchPress(event, root)) {
      return;
    }

    claim(event);
    if (event.repeat || isRepeatedPress(event)) {
      return;
    }

    lastPressTimes.set(event.key, event.timeStamp);
    handleScanEvent(switchEvent(event));
  }

  function handleKeyUp(event: KeyboardEvent) {
    // Buttons activate on Space at keyup, so the release is claimed as well.
    if (isSwitchPress(event, root)) {
      claim(event);
    }
  }

  // Timed per switch: the delay filters an accidental second press of the
  // same switch, not a quick Next followed by Select.
  function isRepeatedPress(event: KeyboardEvent): boolean {
    const lastPressTime = lastPressTimes.get(event.key) ?? -Infinity;
    const elapsedSeconds = (event.timeStamp - lastPressTime) / MS_PER_SECOND;

    return elapsedSeconds < preferences.repeatPressDelay;
  }

  function switchEvent(event: KeyboardEvent): ScanEvent {
    const isNextSwitch = preferences.method === "step" && event.key === " ";

    return isNextSwitch ? "next" : "select";
  }

  document.addEventListener("keydown", handleKeyDown, { capture: true });
  document.addEventListener("keyup", handleKeyUp, { capture: true });

  return {
    restart() {
      if (state.status !== "paused") {
        show({ status: "groups", groupIndex: 0, pass: 0 });
      }
    },
    stop() {
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
      document.removeEventListener("keyup", handleKeyUp, { capture: true });
      show(PAUSED_SCAN);
    },
  };
}

function isSwitchPress(event: KeyboardEvent, root: HTMLElement): boolean {
  if (!SWITCH_KEYS.includes(event.key) || hasModifier(event)) {
    return false;
  }

  return !isEditable(event.target) && !isBehindOverlay(root);
}

function hasModifier(event: KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey || event.altKey || event.shiftKey;
}

function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof Element && target.closest(EDITABLE_SELECTOR) !== null
  );
}

/**
 * MUI hides the app root from assistive technology while a dialog, drawer,
 * menu, or select popup is open. Those own the keyboard, so scanning yields.
 * `inert` is the platform's way to say the same.
 */
function isBehindOverlay(root: HTMLElement): boolean {
  return root.closest('[aria-hidden="true"], [inert]') !== null;
}

// React handlers run whether or not the default was prevented, so the event
// must not reach them: one press would both scan and activate the focused
// control.
function claim(event: KeyboardEvent) {
  event.preventDefault();
  event.stopPropagation();
}
