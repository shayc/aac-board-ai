import {
  Grid,
  MessageBar,
  SuggestionBar,
  Tile,
} from "@features/board/components";
import { useBoard } from "@features/board/context/useBoard";
import type { BoardButton } from "@features/board/types";
import Stack from "@mui/material/Stack";

export function Board() {
  const { board, activateButton, isSuggestionsEnabled } = useBoard();

  if (!board) {
    return null;
  }

  return (
    <Stack
      height="100%"
      direction="column"
      sx={(theme) => ({
        backgroundRepeat: "no-repeat",
        backgroundImage:
          theme.palette.mode === "dark"
            ? "radial-gradient(80% 50% at 50% -20%, rgb(0, 41, 82), transparent)"
            : "radial-gradient(80% 50% at 50% -20%, rgb(204, 230, 255), transparent)",
      })}
    >
      <MessageBar />

      {isSuggestionsEnabled && <SuggestionBar />}

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
            onClick={() => void activateButton(button)}
          />
        )}
      />
    </Stack>
  );
}
