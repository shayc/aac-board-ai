import { Grid } from "@features/board/components/Grid/Grid";
import { OutputBar } from "@features/board/components/OutputBar/OutputBar";
import { SuggestionBar } from "@features/board/components/SuggestionBar/SuggestionBar";
import { Tile } from "@features/board/components/Tile/Tile";
import { useBoard } from "@features/board/context/useBoard";
import { useGrid } from "@features/board/hooks/useGrid";
import type { BoardButton } from "@features/board/types";
import Box from "@mui/material/Box";
import { useSpeech } from "@shared/contexts/SpeechProvider/SpeechProvider";

export function Board() {
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
            board.words.map((word) => word.vocalization ?? word.label).join(" ")
          )
        }
      />

      <SuggestionBar
        suggestions={board.suggestions}
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
                ? board.currentBoard?.images?.find(
                    (img) => img.id === button.imageId
                  )?.data
                : undefined
            }
            onClick={() => {
              const hasActions =
                button.action ?? (button.actions && button.actions.length > 0);

              if (hasActions) {
                return;
              }

              board.addWord({
                ...button,
                image: button.imageId
                  ? board.currentBoard?.images?.find(
                      (img) => img.id === button.imageId
                    )?.data
                  : undefined,
              });
              speech.speak(
                (button.vocalization ?? button.label)?.toLowerCase()
              );
            }}
          />
        )}
      />
    </Box>
  );
}
