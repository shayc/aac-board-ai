import Box from "@mui/material/Box";
import { useSpeech } from "../../providers/SpeechProvider/SpeechProvider";
import { useBoard } from "../../providers/BoardProvider/useBoard";
import { Grid } from "../Grid/Grid";
import { useGrid } from "../hooks/useGrid";
import { OutputBar } from "../OutputBar/OutputBar";
import { SuggestionBar } from "../SuggestionBar/SuggestionBar";
import { Tile } from "../Tile/Tile";
import type { BoardButton } from "../../types";

export function CommunicationBoard() {
  const speech = useSpeech();
  const board = useBoard();
  const grid = useGrid(
    board.currentBoard?.buttons ?? [],
    board.currentBoard?.grid ?? { rows: 0, columns: 0 }
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <OutputBar
        words={board.words}
        onClearClick={() => board.clearWords()}
        onPlayClick={() =>
          speech.speak(
            board.words
              .map((word) => word.vocalization ?? word.label)
              .join(" ")
          )
        }
      />

      <SuggestionBar
        suggestions={board.suggestions}
        proofreaderStatus={board.proofreaderStatus}
        onInitializeProofreader={board.requestProofreaderSession}
        onToneChange={board.changeTone}
      />

      <Grid<BoardButton>
        grid={grid.grid}
        renderCell={(button) => (
          <Tile
            label={button.label}
            backgroundColor={button.backgroundColor}
            borderColor={button.borderColor}
            imageSrc={
              button.imageId
                ? board.currentBoard?.images?.find((img) => img.id === button.imageId)?.data
                : undefined
            }
            onClick={() => {
              const hasActions =
                button.action ?? (button.actions && button.actions.length > 0);

              if (hasActions) {
                return;
              }

              board.addWord(button);
              speech.speak(button.vocalization ?? button.label);
            }}
          />
        )}
      />
    </Box>
  );
}
