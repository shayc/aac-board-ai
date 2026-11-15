import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";

/**
 * Each shortcut's keys as the platform's menus print them, except the spoken
 * ones.
 */
export interface BoardShortcutLabels {
  clear: string;
  /** The clear keys in words, for the hint a screen reader reads aloud. */
  spokenClear: string;
  /** The undo keys in words; undo has no control to print its keys on. */
  spokenUndo: string;
  play: string;
  stop: string;
}

/** Labels for the keys that `resolveBoardShortcut` accepts. */
export function useBoardShortcutLabels(): BoardShortcutLabels {
  const t = useTranslate();

  if (isApplePlatform(currentPlatform())) {
    const command = t(m.keyCommand);

    return {
      clear: "⌘⌫",
      spokenClear: `${command}+${t(m.keyAppleDelete)}`,
      spokenUndo: `${command}+Z`,
      play: "⌘↩",
      stop: t(m.keyEscape),
    };
  }

  const control = t(m.keyControl);
  const clear = `${control}+${t(m.keyBackspace)}`;

  return {
    clear,
    spokenClear: clear,
    spokenUndo: `${control}+Z`,
    play: `${control}+${t(m.keyEnter)}`,
    stop: t(m.keyEscape),
  };
}

export function isApplePlatform(platform: string): boolean {
  return /^(mac|iphone|ipad|ipod)/i.test(platform);
}

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: { platform: string };
};

function currentPlatform(): string {
  const { userAgentData, platform } = navigator as NavigatorWithUserAgentData;

  return userAgentData?.platform ?? platform;
}
