import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";

export interface KeyLabels {
  /** The keys as the platform's menus print them. */
  label: string;
  /** The keys in words, for text a screen reader reads aloud. */
  spokenLabel: string;
}

export interface KeyShortcut extends KeyLabels {
  /** The `aria-keyshortcuts` value, naming every combination that works. */
  ariaKeyShortcuts: string;
}

// aria-keyshortcuts names the keys that activate an element, so clearing,
// which the backspace button only does on a long press, gets labels alone.
export interface BoardKeyShortcuts {
  backspace: Pick<KeyShortcut, "ariaKeyShortcuts">;
  clear: KeyLabels;
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

  const command = t(m.keyCommand);
  const control = t(m.keyControl);
  const escape = t(m.keyEscape);
  const clear = isApple
    ? { label: "⌘⌫", spokenLabel: `${command}+${t(m.keyMacDelete)}` }
    : spokenAsPrinted(`${control}+${t(m.keyBackspace)}`);
  const play = isApple
    ? { label: "⌘↩", spokenLabel: `${command}+${t(m.keyEnter)}` }
    : spokenAsPrinted(`${control}+${t(m.keyEnter)}`);

  return {
    backspace: { ariaKeyShortcuts: "Backspace" },
    clear,
    play: { ...play, ariaKeyShortcuts: "Meta+Enter Control+Enter" },
    stop: { ...spokenAsPrinted(escape), ariaKeyShortcuts: "Escape" },
  };
}

export function isApplePlatform(platform: string): boolean {
  return /^(mac|iphone|ipad|ipod)/i.test(platform);
}

function currentPlatform(): string {
  const { userAgentData, platform } = navigator as NavigatorWithUserAgentData;

  return userAgentData?.platform ?? platform;
}

function spokenAsPrinted(label: string): KeyLabels {
  return { label, spokenLabel: label };
}
