import type { ScanGroup } from "./scan-sequence";

const GROUP_ATTRIBUTE = "data-scan-group";
const HIGHLIGHT_ATTRIBUTE = "data-scan-highlighted";
const ITEM_SELECTOR =
  ":is(button, [role='button']):not(:disabled, [aria-disabled='true'])";

/** Spread on an element to scan the enabled buttons inside it as one group. */
export const scanGroupProps = { [GROUP_ATTRIBUTE]: "" } as const;

/** A scan group of alike controls, such as a row of tiles, highlighted as one outline. */
export const scanRowProps = { [GROUP_ATTRIBUTE]: "row" } as const;

// CSS keeps group highlighting current as buttons are enabled or replaced.
export const SCAN_HIGHLIGHTED_ITEM_SELECTOR = `${ITEM_SELECTOR}:is([${HIGHLIGHT_ATTRIBUTE}], [${HIGHLIGHT_ATTRIBUTE}] *)`;

export const SCAN_HIGHLIGHTED_ROW_SELECTOR = `[${GROUP_ATTRIBUTE}='row'][${HIGHLIGHT_ATTRIBUTE}]`;

// The highlight is an outline, so it reaches past the edge of what it marks.
// Whatever clips a scanned control, such as a scroll container, has to leave
// that much room around it.
export const SCAN_OUTLINE_WIDTH_PX = 4;
export const SCAN_OUTLINE_OFFSET_PX = 2;
export const SCAN_OUTLINE_REACH_PX =
  SCAN_OUTLINE_WIDTH_PX + SCAN_OUTLINE_OFFSET_PX;

export function listScanGroups(root: HTMLElement): ScanGroup<HTMLElement>[] {
  const groups: ScanGroup<HTMLElement>[] = [];

  for (const container of root.querySelectorAll<HTMLElement>(
    `[${GROUP_ATTRIBUTE}]`,
  )) {
    const [firstItem, ...otherItems] = listScanItems(container);
    if (firstItem) {
      groups.push({ container, items: [firstItem, ...otherItems] });
    }
  }

  return groups;
}

function listScanItems(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(ITEM_SELECTOR),
  ).filter((item) => item.checkVisibility({ visibilityProperty: true }));
}

export function isScanningScopeCovered(scope: HTMLElement): boolean {
  return scope.closest("[aria-hidden='true'], [inert]") !== null;
}

export function highlightScanTarget(target: HTMLElement): () => void {
  target.setAttribute(HIGHLIGHT_ATTRIBUTE, "");

  return () => target.removeAttribute(HIGHLIGHT_ATTRIBUTE);
}

export function scrollScanTargetIntoView(target: HTMLElement): void {
  const firstItem = target.querySelector(ITEM_SELECTOR) ?? target;
  firstItem.scrollIntoView({ block: "nearest", inline: "nearest" });
}
