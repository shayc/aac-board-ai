import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { BOARD_SHORTCUT_ARIA_KEYS } from "./resolve-board-shortcut";

interface ShortcutLabel {
  /** The `aria-keyshortcuts` value, naming every combination that works. */
  ariaKeyShortcuts: string;
  /** The keys as the platform's menus print them. */
  keys: string;
}

interface SpokenShortcutLabel {
  keys: string;
  /** The keys in words, for the hint a screen reader reads aloud. */
  spokenKeys: string;
}

export interface BoardShortcutLabels {
  backspace: Pick<ShortcutLabel, "ariaKeyShortcuts">;
  clear: SpokenShortcutLabel;
  play: ShortcutLabel;
  stop: ShortcutLabel;
}

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: { platform: string };
};

/** Labels for the keys that `resolveBoardShortcut` accepts. */
export function useBoardShortcutLabels(): BoardShortcutLabels {
  const t = useTranslate();
  const isApple = isApplePlatform(currentPlatform());

  const control = t(m.keyControl);
  const clearKeys = `${control}+${t(m.keyBackspace)}`;
  const clear = isApple
    ? {
        keys: "⌘⌫",
        spokenKeys: `${t(m.keyCommand)}+${t(m.keyAppleDelete)}`,
      }
    : { keys: clearKeys, spokenKeys: clearKeys };

  return {
    backspace: { ariaKeyShortcuts: BOARD_SHORTCUT_ARIA_KEYS.backspace },
    clear,
    play: {
      ariaKeyShortcuts: BOARD_SHORTCUT_ARIA_KEYS.play,
      keys: isApple ? "⌘↩" : `${control}+${t(m.keyEnter)}`,
    },
    stop: {
      ariaKeyShortcuts: BOARD_SHORTCUT_ARIA_KEYS.stop,
      keys: t(m.keyEscape),
    },
  };
}

export function isApplePlatform(platform: string): boolean {
  return /^(mac|iphone|ipad|ipod)/i.test(platform);
}

function currentPlatform(): string {
  const { userAgentData, platform } = navigator as NavigatorWithUserAgentData;

  return userAgentData?.platform ?? platform;
}
