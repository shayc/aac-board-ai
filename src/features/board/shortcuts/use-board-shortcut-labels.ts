import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";

export interface BoardShortcutLabels {
  clear: string;
  /** The clear shortcut in words, for screen reader announcements. */
  spokenClear: string;
  play: string;
  stop: string;
}

export function useBoardShortcutLabels(): BoardShortcutLabels {
  const t = useTranslate();

  if (isApplePlatform(currentPlatform())) {
    return {
      clear: "⌘⌫",
      spokenClear: `${t(m.keyCommand)}+${t(m.keyAppleDelete)}`,
      play: "⌘↩",
      stop: t(m.keyEscape),
    };
  }

  const control = t(m.keyControl);
  const clear = `${control}+${t(m.keyBackspace)}`;

  return {
    clear,
    spokenClear: clear,
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
