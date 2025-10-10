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
        height: { xs: 150, sm: 200 },
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
          backgroundColor: (theme) => theme.palette.grey[800],
          borderRadius: 10,
        }}
      >
        <Box sx={{ display: "flex", gap: 2, flexGrow: 1 }}>
          {words.map((word, index) => (
            <Pictogram key={index} label={word.label} src={word.image} />
          ))}
        </Box>

        {hasWords && (
          <Tooltip title="Clear message">
            <Box sx={{ alignSelf: "center" }}>
              <IconButton
                aria-label="Clear"
                size="large"
                color="inherit"
                onClick={onClearClick}
              >
                <ClearIcon />
              </IconButton>
            </Box>
          </Tooltip>
        )}
      </Box>

      <Tooltip title="Speak message">
        <Box sx={{ alignSelf: "center" }}>
          <IconButton
            aria-label="Play"
            size="large"
            color="inherit"
            onClick={onPlayClick}
          >
            <PlayArrowIcon />
          </IconButton>
        </Box>
      </Tooltip>
    </Box>
  );
}
