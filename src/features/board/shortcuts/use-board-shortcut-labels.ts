import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";

/** Each shortcut's keys as the platform's menus print them. */
export interface BoardShortcutLabels {
  clear: string;
  /** The clear keys in words, for the hint a screen reader reads aloud. */
  spokenClear: string;
  play: string;
  stop: string;
}

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: { platform: string };
};

/** Labels for the keys that `resolveBoardShortcut` accepts. */
export function useBoardShortcutLabels(): BoardShortcutLabels {
  const t = useTranslate();
  const stop = t(m.keyEscape);

  if (isApplePlatform(currentPlatform())) {
    return {
      clear: "⌘⌫",
      spokenClear: `${t(m.keyCommand)}+${t(m.keyAppleDelete)}`,
      play: "⌘↩",
      stop,
    };
  }

  const control = t(m.keyControl);
  const clear = `${control}+${t(m.keyBackspace)}`;

  return {
    clear,
    spokenClear: clear,
    play: `${control}+${t(m.keyEnter)}`,
    stop,
  };
}

export function isApplePlatform(platform: string): boolean {
  return /^(mac|iphone|ipad|ipod)/i.test(platform);
}

function currentPlatform(): string {
  const { userAgentData, platform } = navigator as NavigatorWithUserAgentData;

  return userAgentData?.platform ?? platform;
}
