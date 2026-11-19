export const CONTROL_SIZES = { medium: 64, large: 80 } as const;

export const CONTROL_ICON_SIZE = 32;

// Set by the message bar, so its largest control cannot outgrow it.
export const CONTROL_SIZE_PROPERTY = "--control-size";
export const MESSAGE_CONTROL_SIZE = `var(${CONTROL_SIZE_PROPERTY}, ${CONTROL_SIZES.large}px)`;
