import Box from "@mui/material/Box";
import { useSpeech } from "../../providers/SpeechProvider/SpeechProvider";
import { Grid } from "./Grid/Grid";
import { useCommunicationBoard } from "./hooks/useCommunicationBoard";
import { useGrid } from "./hooks/useGrid";
import { useOutput } from "./hooks/useOutput";
import { useSuggestions } from "./hooks/useSuggestions";
import { OutputBar } from "./OutputBar/OutputBar";
import { SuggestionBar } from "./SuggestionBar/SuggestionBar";
import { Tile } from "./Tile/Tile";
import type { BoardButton } from "./types";

export function CommunicationBoard() {
  const speech = useSpeech();
  const board = useCommunicationBoard();
  const output = useOutput();
  const grid = useGrid(board.buttons, board.grid);
  const suggestions = useSuggestions();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <OutputBar
        words={output.words}
        onClearClick={() => output.clear()}
        onPlayClick={() =>
          speech.speak(
            output.words
              .map((word) => word.vocalization ?? word.label)
              .join(" ")
          )
        }
      />

      <SuggestionBar suggestions={suggestions.suggestions} />

      <Grid<BoardButton>
        grid={grid.grid}
        renderCell={(button) => (
          <Tile
            label={button.label}
            backgroundColor={button.backgroundColor}
            borderColor={button.borderColor}
            imageSrc={
              button.imageId
                ? board.images?.find((img) => img.id === button.imageId)?.data
                : undefined
            }
            onClick={() => {
              const hasActions =
                button.action ?? (button.actions && button.actions.length > 0);

              if (hasActions) {
                return;
              }

              output.addWord(button);
              speech.speak(button.vocalization ?? button.label);
            }}
          />
        )}
      />
    </Box>
  );
}
