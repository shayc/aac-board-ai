// Play and the controls level with it are large. Medium is a step smaller, so
// play stays the main action of the message row; a short landscape screen has
// no height for the extra step and drops every control to it.
export const CONTROL_SIZES = { medium: 64, large: 80 } as const;

// One icon size for every control, round or pill, medium or large: Material 3's
// icon for an 80px button. Only round play is heavier, to stay the row's main
// action; a pill's fill already sets play apart.
export const CONTROL_ICON_SIZE = 28;

// The message bar is as tall as its largest control plus its inset, so it sets
// that control's size and the control cannot outgrow it.
export const CONTROL_SIZE_PROPERTY = "--control-size";
