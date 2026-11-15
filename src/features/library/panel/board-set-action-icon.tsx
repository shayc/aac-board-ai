import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import Box from "@mui/material/Box";
import CircularProgress, {
  circularProgressClasses,
} from "@mui/material/CircularProgress";
import Fade from "@mui/material/Fade";
import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import type { BoardSetDownloadPhase } from "../catalog/board-set-downloads";

const PROGRESS_RING_SIZE = 24;

interface BoardSetActionIconProps {
  phase: BoardSetDownloadPhase | undefined;
  isOpenable: boolean;
}

// Crossfades between states so the button reads as one control changing state,
// as when a finished download's ring becomes the menu icon.
export function BoardSetActionIcon({
  phase,
  isOpenable,
}: BoardSetActionIconProps) {
  const theme = useTheme();
  const [lastPhase, setLastPhase] = useState(phase);

  if (phase && phase !== lastPhase) {
    setLastPhase(phase);
  }

  // The ring keeps showing how far the download got while it fades out.
  const ringPhase = phase ?? lastPhase;
  const fadeProps = {
    appear: false,
    timeout: theme.transitions.duration.shortest,
    unmountOnExit: true,
  };

  return (
    <Box
      sx={{
        display: "grid",
        placeItems: "center",
        "& > *": { gridArea: "1 / 1" },
      }}
    >
      <Fade in={isOpenable} {...fadeProps}>
        <MoreVertIcon />
      </Fade>

      <Fade in={!isOpenable && phase === undefined} {...fadeProps}>
        <DownloadOutlinedIcon />
      </Fade>

      <Fade in={phase !== undefined} {...fadeProps}>
        <Box sx={{ position: "relative", display: "inline-flex" }}>
          <CircularProgress
            aria-hidden
            color="inherit"
            size={PROGRESS_RING_SIZE}
            enableTrackSlot
            {...ringProgress(ringPhase)}
            sx={{
              // Downloads can update faster than MUI's default 300ms transition.
              [`& .${circularProgressClasses.circle}`]: { transition: "none" },
            }}
          />

          {ringPhase?.kind !== "importing" && (
            <StopRoundedIcon
              sx={{
                position: "absolute",
                inset: 0,
                margin: "auto",
                fontSize: 14,
              }}
            />
          )}
        </Box>
      </Fade>
    </Box>
  );
}

type RingProgress =
  | { variant: "determinate"; value: number }
  | { variant: "indeterminate" };

function ringProgress(phase: BoardSetDownloadPhase | undefined): RingProgress {
  // Wait for response headers to avoid flashing an indeterminate spinner.
  if (!phase || phase.kind === "connecting") {
    return { variant: "determinate", value: 0 };
  }

  if (phase.kind === "importing") {
    return { variant: "determinate", value: 100 };
  }

  if (phase.total === undefined) {
    return { variant: "indeterminate" };
  }

  return {
    variant: "determinate",
    value: Math.min(100, (phase.loaded / phase.total) * 100),
  };
}
