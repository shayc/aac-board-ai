import { MessageBar } from "@/features/board/components/MessageBar/MessageBar";
import { Grid } from "@features/board/components/Grid/Grid";
import { SuggestionBar } from "@features/board/components/SuggestionBar/SuggestionBar";
import { Tile } from "@features/board/components/Tile/Tile";
import { useBoard } from "@features/board/context/useBoard";
import type { BoardButton } from "@features/board/types";
import Stack from "@mui/material/Stack";

export function Board() {
  const { board, playBoardButton } = useBoard();

  if (!board) {
    return null;
  }

  return (
    <Stack height="100%" direction="column">
      <MessageBar />

      <SuggestionBar />

      <Grid<BoardButton>
        rows={board.grid.rows}
        columns={board.grid.columns}
        order={board.grid.order}
        items={board.buttons}
        renderItem={(button) => (
          <Tile
            key={button.id}
            label={button.label}
            imageSrc={button.imageSrc}
            backgroundColor={button.backgroundColor}
            borderColor={button.borderColor}
            variant={button.loadBoard ? "folder" : undefined}
            onClick={() => playBoardButton(button)}
          />
        )}
      />
    </Stack>
  );
}
