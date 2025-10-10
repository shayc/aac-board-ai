import { Pictogram } from "@features/board/components/Pictogram/Pictogram";
import ClearIcon from "@mui/icons-material/Clear";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

interface Word {
  id: string;
  label: string;
  image?: string;
}

export interface OutputBarProps {
  words: Word[];
  onClearClick: () => void;
  onPlayClick: () => void;
}

export function OutputBar({
  words,
  onClearClick,
  onPlayClick,
}: OutputBarProps) {
  const hasWords = words.length > 0;

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
          {words.map((word, index) => (
            <Pictogram key={index} label={word.label} src={word.image} />
          ))}
        </Box>

        {hasWords && (
          <Tooltip title="Clear message" enterDelay={1000}>
            <Box sx={{ alignSelf: "center" }}>
              <IconButton
                aria-label="Clear"
                size="large"
                color="inherit"
                onClick={onClearClick}
                sx={{
                  width: 64,
                  height: 64,
                }}
              >
                <ClearIcon />
              </IconButton>
            </Box>
          </Tooltip>
        )}
      </Box>

      <Tooltip title="Speak message" enterDelay={1000}>
        <Box sx={{ alignSelf: "center" }}>
          <IconButton
            aria-label="Play"
            size="large"
            onClick={onPlayClick}
            sx={{
              width: 64,
              height: 64,
              backgroundColor: (theme) => theme.palette.primary.main,
              color: (theme) => theme.palette.primary.contrastText,
              "&:hover": {
                backgroundColor: (theme) => theme.palette.primary.dark,
              },
            }}
          >
            <PlayArrowIcon />
          </IconButton>
        </Box>
      </Tooltip>
    </Box>
  );
}
