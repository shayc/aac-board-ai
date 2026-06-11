import Box from "@mui/material/Box";
import { orange } from "@mui/material/colors";
import { keyframes } from "@mui/material/styles";

export const DOT_PROGRESS_SIZE = 10;

const pulse = keyframes`
  0%, 100% {
    transform: scale(0.95);
    opacity: 0.3;
  }
  35% {
    transform: scale(1.1);
    opacity: 1;
  }
`;

export function DotProgress() {
  return (
    <Box
      sx={{
        width: DOT_PROGRESS_SIZE,
        aspectRatio: "1",
        borderRadius: "50%",
        backgroundColor: orange[400],
        animation: `${pulse} 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
      }}
    />
  );
}
