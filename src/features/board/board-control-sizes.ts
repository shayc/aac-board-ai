// Medium is a step below play's large, so play stays the message row's main
// action. A short landscape screen drops every control to medium.
export const CONTROL_SIZES = { medium: 64, large: 80 } as const;

// Material 3's icon size for an 80px button, used by every control but play.
export const CONTROL_ICON_SIZE = 28;

// Set by the message bar, so its largest control cannot outgrow it.
export const CONTROL_SIZE_PROPERTY = "--control-size";
