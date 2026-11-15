import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";

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

// aria-keyshortcuts names the keys that activate an element, so clearing,
// which the backspace button only does on a long press, gets no value.
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
    backspace: { ariaKeyShortcuts: "Backspace" },
    clear,
    play: {
      ariaKeyShortcuts: "Meta+Enter Control+Enter",
      keys: isApple ? "⌘↩" : `${control}+${t(m.keyEnter)}`,
    },
    stop: { ariaKeyShortcuts: "Escape", keys: t(m.keyEscape) },
  };
}

export function isApplePlatform(platform: string): boolean {
  return /^(mac|iphone|ipad|ipod)/i.test(platform);
}

function currentPlatform(): string {
  const { userAgentData, platform } = navigator as NavigatorWithUserAgentData;

  return userAgentData?.platform ?? platform;
}
