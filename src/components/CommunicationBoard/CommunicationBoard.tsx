import Box from "@mui/material/Box";
import { useSpeech } from "../../providers/SpeechProvider/SpeechProvider";
import { Grid } from "./Grid/Grid";
import { useCommunicationBoard } from "./hooks/useCommunicationBoard";
import { useGrid } from "./hooks/useGrid";
import { useSentence } from "./hooks/useSentence";
import { useSuggestions } from "./hooks/useSuggestions";
import { SentenceBar } from "./SentenceBar/SentenceBar";
import { SuggestionBar } from "./SuggestionBar/SuggestionBar";
import { Tile } from "./Tile/Tile";
import type { BoardButton } from "./types";

export function CommunicationBoard() {
  const speech = useSpeech();
  const board = useCommunicationBoard();
  const sentence = useSentence();
  const grid = useGrid(board.buttons, board.grid);
  const suggestions = useSuggestions();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <SentenceBar
        words={sentence.words}
        onClearClick={() => sentence.clear()}
        onPlayClick={() =>
          speech.speak(sentence.words.map((word) => word.label).join(" "))
        }
      />

      <SuggestionBar suggestions={suggestions.suggestions} />

      <Grid<BoardButton>
        grid={grid.grid}
        renderCell={(button) => (
          <Tile
            label={button.label}
            onClick={() => {
              const hasActions =
                button.action ?? (button.actions && button.actions.length > 0);

              if (hasActions) {
                return;
              }

              sentence.addWord(button);
              speech.speak(button.vocalization ?? button.label);
            }}
          />
        )}
      />
    </Box>
  );
}
