import ClearIcon from "@mui/icons-material/Clear";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import { Pictogram } from "../Pictogram/Pictogram";

interface Word {
  id: string;
  label: string;
  image?: string;
}

export interface SentenceBarProps {
  words: Word[];
  onClearClick: () => void;
  onPlayClick: () => void;
}

export function SentenceBar(props: SentenceBarProps) {
  const { words, onClearClick, onPlayClick } = props;
  const hasWords = words.length > 0;

  return (
    <Box>
      <Box>
        {words.map((word, index) => (
          <Pictogram key={index} label={word.label} src={word.image} />
        ))}
      </Box>

      <Box>
        {hasWords && (
          <IconButton
            aria-label="Clear"
            size="large"
            color="inherit"
            onClick={onClearClick}
          >
            <ClearIcon />
          </IconButton>
        )}
      </Box>

      <IconButton
        aria-label="Play"
        size="large"
        color="inherit"
        onClick={onPlayClick}
      >
        <PlayArrowIcon />
      </IconButton>
    </Box>
  );
}
