import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import Fab, { type FabProps } from "@mui/material/Fab";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { mergeSx } from "@shared/theme/merge-sx";

const iconSx = { fontSize: 32 };

interface PlayButtonOwnProps {
  isPlaying: boolean;
  onPlayClick: () => void;
  onStopClick: () => void;
}

export type PlayButtonRootProps = Omit<
  FabProps,
  keyof PlayButtonOwnProps | "aria-label" | "children" | "color" | "onClick"
>;

type PlayButtonProps = PlayButtonOwnProps & PlayButtonRootProps;

export function PlayButton({
  isPlaying,
  onPlayClick,
  onStopClick,
  sx,
  ...fabProps
}: PlayButtonProps) {
  const t = useTranslate();
  const label = isPlaying ? t(m.messageStop) : t(m.messagePlay);

  return (
    <Fab
      {...fabProps}
      color={isPlaying ? "default" : "primary"}
      aria-label={label}
      onClick={isPlaying ? onStopClick : onPlayClick}
      sx={mergeSx(
        {
          width: 72,
          height: 72,
          flexShrink: 0,
          my: 2,
          marginInlineStart: 0,
          marginInlineEnd: 2,
          alignSelf: "center",
        },
        sx,
      )}
    >
      {isPlaying ? <StopIcon sx={iconSx} /> : <PlayArrowIcon sx={iconSx} />}
    </Fab>
  );
}
