import { MessageBar } from "@/features/board/components/MessageBar/MessageBar";
import { Grid } from "@features/board/components/Grid/Grid";
import { SuggestionBar } from "@features/board/components/SuggestionBar/SuggestionBar";
import { Tile } from "@features/board/components/Tile/Tile";
import { useBoard } from "@features/board/context/useBoard";
import type { BoardButton } from "@features/board/types";
import Box from "@mui/material/Box";

export function Board() {
  const { board } = useBoard();

  if (board.isLoading) {
    return <Box sx={{ p: 4, textAlign: "center" }}>Loading board...</Box>;
  }

  if (board.error) {
    return (
      <Box sx={{ p: 4, textAlign: "center", color: "error.main" }}>
        Error: {board.error.message}
      </Box>
    );
  }

  if (!board.current) {
    return <Box sx={{ p: 4, textAlign: "center" }}>No board loaded</Box>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <MessageBar />

      <SuggestionBar />

      <Grid<BoardButton>
        rows={board.current.grid.rows}
        columns={board.current.grid.columns}
        items={board.current.buttons}
        renderCell={(button) => (
          <Tile
            label={button.label}
            backgroundColor={button.backgroundColor}
            borderColor={button.borderColor}
            variant={button.loadBoard ? "folder" : undefined}
            imageSrc={button.imageSrc}
            onClick={() => board.onButtonClick(button)}
          />
        )}
      />
    </Box>
  );
}
