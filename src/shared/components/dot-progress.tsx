import Box from "@mui/material/Box";
import { orange } from "@mui/material/colors";

export function DotProgress() {
  return (
    <Box
      sx={{
        width: 12,
        aspectRatio: "1",
        borderRadius: "50%",
        backgroundColor: orange[500],
        animation: "dot-progress 1s ease-in-out infinite alternate",
        "@keyframes dot-progress": {
          to: { opacity: 0.2 },
        },
      }}
    />
  );
}
