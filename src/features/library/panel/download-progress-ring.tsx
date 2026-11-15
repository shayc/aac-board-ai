import CircularProgress, {
  circularProgressClasses,
} from "@mui/material/CircularProgress";

const PROGRESS_RING_SIZE = 24;

export type RingProgress =
  | { variant: "determinate"; value: number }
  | { variant: "indeterminate" };

export function DownloadProgressRing(progress: RingProgress) {
  return (
    <CircularProgress
      aria-hidden
      color="inherit"
      size={PROGRESS_RING_SIZE}
      enableTrackSlot
      {...progress}
      sx={{
        // Downloads can update faster than MUI's default 300ms transition.
        [`& .${circularProgressClasses.circle}`]: { transition: "none" },
      }}
    />
  );
}
