import { m } from "@paraglide/messages.js";
import type { SwitchInput } from "@shared/switch-scanning/switch-scanning-store";

function getSwitchInputLabel(input: SwitchInput): string {
  if (input.kind === "keyboard") {
    if (
      input.code === "MetaLeft" ||
      input.code === "MetaRight" ||
      input.label === "Meta"
    ) {
      const platform = navigator.platform.toLocaleLowerCase();

      if (platform.includes("mac")) {
        return m.switchScanningCommandKey();
      }

      if (platform.includes("win")) {
        return m.switchScanningWindowsKey();
      }

      return m.switchScanningMetaKey();
    }

    return input.label;
  }

  switch (input.button) {
    case 0:
      return m.switchScanningLeftMouseButton();
    case 1:
      return m.switchScanningMiddleMouseButton();
    case 2:
      return m.switchScanningRightMouseButton();
    default:
      return m.switchScanningMouseInput({ button: input.button + 1 });
  }
}

export function formatSwitchInput(input: SwitchInput): string {
  return getSwitchInputLabel(input);
}
