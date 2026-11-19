// Medium is a step below play's large, so play stays the message row's main
// action. A short landscape screen drops every control to medium, and backspace
// to small (MUI's large icon button) to stay a step below play.
export const CONTROL_SIZES = { small: 52, medium: 64, large: 80 } as const;

// Material 3's icon size for an 80px button, used by every control, round or
// pill; only round play is heavier.
export const CONTROL_ICON_SIZE = 28;

// MUI's default icon size, as in the app bar, for the small control: 28px
// would crowd a 52px button.
export const SMALL_CONTROL_ICON_SIZE = 24;

// Set by the message bar, so its largest control cannot outgrow it.
export const CONTROL_SIZE_PROPERTY = "--control-size";
