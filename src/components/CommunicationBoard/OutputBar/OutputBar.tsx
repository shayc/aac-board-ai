import ClearIcon from "@mui/icons-material/Clear";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { Pictogram } from "../Pictogram/Pictogram";

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
        height: "250px",
        display: "flex",
        justifyContent: "space-between",
        gap: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 1,
          flexGrow: 1,
        }}
      >
        <Box sx={{ display: "flex", gap: 1, flexGrow: 1 }}>
          {words.map((word, index) => (
            <Pictogram key={index} label={word.label} src={word.image} />
          ))}
        </Box>

        {hasWords && (
          <Tooltip title="Clear message">
            <IconButton
              aria-label="Clear"
              size="large"
              color="inherit"
              sx={{ alignSelf: "center" }}
              onClick={onClearClick}
            >
              <ClearIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Tooltip title="Speak message">
        <IconButton
          aria-label="Play"
          size="large"
          color="inherit"
          sx={{ alignSelf: "center" }}
          onClick={onPlayClick}
        >
          <PlayArrowIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
