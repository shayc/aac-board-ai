import { buttonClasses } from "@mui/material/Button";

interface FocusableDisabledProps {
  "aria-disabled"?: true;
  className?: string;
}

/**
 * Preserve keyboard focus when a button disables itself after activation.
 * The button stays clickable, so pass its click handler here: it is dropped
 * while disabled. Without a handler, the caller must ignore activation while
 * disabled itself.
 */
export function focusableDisabledProps(
  isDisabled: boolean,
): FocusableDisabledProps;
export function focusableDisabledProps<OnClick>(
  isDisabled: boolean,
  onClick: OnClick,
): FocusableDisabledProps & { onClick: OnClick | undefined };
export function focusableDisabledProps<OnClick>(
  isDisabled: boolean,
  onClick?: OnClick,
): FocusableDisabledProps & { onClick?: OnClick } {
  if (isDisabled) {
    return { "aria-disabled": true, className: buttonClasses.disabled };
  }

  return onClick ? { onClick } : {};
}
