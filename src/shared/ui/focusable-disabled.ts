import { buttonClasses } from "@mui/material/Button";

/**
 * Preserve keyboard focus when a button disables itself after activation.
 * Callers must ignore activation while aria-disabled.
 */
export function focusableDisabledProps(isDisabled: boolean) {
  if (!isDisabled) {
    return {};
  }

  return { "aria-disabled": true, className: buttonClasses.disabled };
}
