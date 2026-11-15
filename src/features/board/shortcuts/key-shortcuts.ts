import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";

export interface KeyShortcut {
  /** The `aria-keyshortcuts` value, naming every combination that works. */
  ariaKeyShortcuts: string;
  /** The keys as the platform's menus print them. */
  label: string;
}

export interface ClearShortcut {
  label: string;
  /** The keys in words, for the hint a screen reader reads aloud. */
  spokenLabel: string;
}

// aria-keyshortcuts names the keys that activate an element, so clearing,
// which the backspace button only does on a long press, gets labels alone.
export interface BoardKeyShortcuts {
  backspace: Pick<KeyShortcut, "ariaKeyShortcuts">;
  clear: ClearShortcut;
  play: KeyShortcut;
  stop: KeyShortcut;
}

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: { platform: string };
};

/** Labels for the keys that `resolveBoardShortcut` accepts. */
export function useBoardKeyShortcuts(): BoardKeyShortcuts {
  const t = useTranslate();
  const isApple = isApplePlatform(currentPlatform());

  const control = t(m.keyControl);
  const clearKeys = `${control}+${t(m.keyBackspace)}`;
  const clear = isApple
    ? {
        label: "⌘⌫",
        spokenLabel: `${t(m.keyCommand)}+${t(m.keyMacDelete)}`,
      }
    : { label: clearKeys, spokenLabel: clearKeys };

  return {
    backspace: { ariaKeyShortcuts: "Backspace" },
    clear,
    play: {
      ariaKeyShortcuts: "Meta+Enter Control+Enter",
      label: isApple ? "⌘↩" : `${control}+${t(m.keyEnter)}`,
    },
    stop: { ariaKeyShortcuts: "Escape", label: t(m.keyEscape) },
  };
}

export function isApplePlatform(platform: string): boolean {
  return /^(mac|iphone|ipad|ipod)/i.test(platform);
}

function currentPlatform(): string {
  const { userAgentData, platform } = navigator as NavigatorWithUserAgentData;

  return userAgentData?.platform ?? platform;
}
