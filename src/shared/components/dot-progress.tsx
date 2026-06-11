import Box from "@mui/material/Box";
import { orange } from "@mui/material/colors";

export const DOT_PROGRESS_SIZE = 12;

export function DotProgress() {
  return (
    <Box
      sx={{
        width: DOT_PROGRESS_SIZE,
        aspectRatio: "1",
        borderRadius: "50%",
        backgroundColor: orange[500],
        animation: "dot-progress 0.6s ease-in-out infinite alternate",
        "@keyframes dot-progress": {
          from: { opacity: 0.2 },
          to: { opacity: 1 },
        },
      }}
    />
  );
}
