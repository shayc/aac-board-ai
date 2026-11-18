import { buttonClasses } from "@mui/material/Button";

/**
 * A button that disables itself after activation keeps keyboard focus this way.
 * Callers must ignore activation while aria-disabled.
 */
export function focusableDisabledProps(
  isDisabled: boolean,
  className?: string,
) {
  if (!isDisabled) {
    return {};
  }

  return {
    "aria-disabled": true,
    className: className
      ? `${className} ${buttonClasses.disabled}`
      : buttonClasses.disabled,
  };
}
