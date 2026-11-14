import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";
import Fab, { fabClasses } from "@mui/material/Fab";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { flipForRTL } from "@shared/theme/rtl";
import { focusableDisabledProps } from "@shared/ui/focusable-disabled";
import { mergeProps, useLongPress, usePress } from "react-aria";

const LONG_PRESS_THRESHOLD_MS = 600;
const SIZE = 64;

interface BackspaceButtonProps {
  disabled?: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

export function BackspaceButton({
  disabled = false,
  onPress,
  onLongPress,
}: BackspaceButtonProps) {
  const t = useTranslate();
  const { pressProps } = usePress({ isDisabled: disabled, onPress });

  const { longPressProps } = useLongPress({
    accessibilityDescription: t(m.messageBackspaceLongPressHint),
    isDisabled: disabled,
    threshold: LONG_PRESS_THRESHOLD_MS,
    onLongPress,
  });

  return (
    <Fab
      {...mergeProps(pressProps, longPressProps)}
      {...focusableDisabledProps(disabled)}
      aria-label={t(m.messageBackspace)}
      sx={(theme) => {
        const { activatedOpacity, hoverOpacity, disabledOpacity } =
          theme.vars.palette.action;
        const tint = theme.alpha(
          theme.vars.palette.primary.main,
          activatedOpacity,
        );

        return {
          flexShrink: 0,
          width: SIZE,
          height: SIZE,
          // With the bar's inset, this centers the circle on the bar's
          // rounded end so both curves run parallel.
          marginInlineEnd: 1,
          color: "primary.main",
          backgroundColor: tint,
          [`&, &:active, &.${fabClasses.focusVisible}`]: { boxShadow: "none" },
          "&:hover": {
            backgroundColor: theme.alpha(
              theme.vars.palette.primary.main,
              `${activatedOpacity} + ${hoverOpacity}`,
            ),
          },
          // Matches the play button's empty-bar tint.
          [`&.${fabClasses.disabled}`]: {
            color: theme.alpha(
              theme.vars.palette.primary.main,
              disabledOpacity,
            ),
            backgroundColor: tint,
          },
        };
      }}
    >
      <BackspaceOutlinedIcon sx={flipForRTL} />
    </Fab>
  );
}
