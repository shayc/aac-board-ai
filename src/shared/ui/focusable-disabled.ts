import { buttonClasses } from "@mui/material/Button";

/**
 * Disables a button without the native `disabled` attribute.
 *
 * A natively disabled button can't hold focus, so a button that disables
 * itself when pressed (Go back on reaching the home board, Backspace on the
 * last message part) would drop keyboard focus to `<body>`. This keeps the
 * button focusable, announces it as disabled, and reuses MUI's disabled look.
 * The caller still has to ignore activation while disabled.
 */
export function focusableDisabledProps(isDisabled: boolean) {
  if (!isDisabled) {
    return {};
  }

  return { "aria-disabled": true, className: buttonClasses.disabled };
}
