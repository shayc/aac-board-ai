import { Pictogram } from "@features/board/components/Pictogram/Pictogram";
import ClearIcon from "@mui/icons-material/Clear";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useBoard } from "../../context/useBoard";

export function MessageBar() {
  const { message } = useBoard();
  const hasParts = message.parts.length > 0;

  return (
    <Box
      sx={{
        flexShrink: 0,
        height: 128,
        display: "flex",
        justifyContent: "space-between",
        padding: 2,
        gap: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexGrow: 1,
          padding: 2,
          overflow: "hidden",
          borderRadius: 12,
          backgroundColor: (theme) =>
            theme.palette.mode === "dark"
              ? theme.palette.grey[800]
              : theme.palette.grey[200],
        }}
      >
        <Box sx={{ display: "flex", gap: 2, flexGrow: 1, overflowX: "auto" }}>
          {message.parts.map((p, index) => (
            <Pictogram key={index} label={p.label} src={p.imageSrc} />
          ))}
        </Box>

        {hasParts && (
          <Tooltip title="Clear message" enterDelay={800}>
            <Box sx={{ alignSelf: "center" }}>
              <IconButton
                aria-label="Clear"
                size="large"
                color="inherit"
                onClick={() => message.clear()}
              >
                <ClearIcon />
              </IconButton>
            </Box>
          </Tooltip>
        )}
      </Box>

      <Tooltip title="Speak message" enterDelay={800}>
        <Box sx={{ alignSelf: "center" }}>
          <IconButton
            aria-label="Play"
            size="large"
            onClick={() => message.play()}
            sx={{
              width: 96,
              height: 96,
              backgroundColor: (theme) => theme.palette.primary.main,
              color: (theme) => theme.palette.primary.contrastText,
              "&:hover": {
                backgroundColor: (theme) => theme.palette.primary.dark,
              },
            }}
          >
            <PlayArrowIcon sx={{ width: 48, height: 48 }} />
          </IconButton>
        </Box>
      </Tooltip>
    </Box>
  );
}
