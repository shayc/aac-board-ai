import { m } from "@paraglide/messages.js";
import type { Translate } from "@shared/language/use-translate";
import type { SwitchInput } from "@shared/switch-scanning/switch-scanning-store";

function getSwitchInputLabel(t: Translate, input: SwitchInput): string {
  if (input.kind === "keyboard") {
    if (
      input.code === "MetaLeft" ||
      input.code === "MetaRight" ||
      input.label === "Meta"
    ) {
      const platform = navigator.platform.toLocaleLowerCase();

      if (platform.includes("mac")) {
        return t(m.switchScanningCommandKey);
      }

      if (platform.includes("win")) {
        return t(m.switchScanningWindowsKey);
      }

      return t(m.switchScanningMetaKey);
    }

    return input.label;
  }

  switch (input.button) {
    case 0:
      return t(m.switchScanningLeftMouseButton);
    case 1:
      return t(m.switchScanningMiddleMouseButton);
    case 2:
      return t(m.switchScanningRightMouseButton);
    default:
      return t(m.switchScanningMouseInput, { button: input.button + 1 });
  }
}

export function formatSwitchInput(t: Translate, input: SwitchInput): string {
  return getSwitchInputLabel(t, input);
}
