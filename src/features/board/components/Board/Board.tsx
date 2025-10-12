import { Grid } from "@features/board/components/Grid/Grid";
import { OutputBar } from "@features/board/components/OutputBar/OutputBar";
import { SuggestionBar } from "@features/board/components/SuggestionBar/SuggestionBar";
import { Tile } from "@features/board/components/Tile/Tile";
import { useBoard } from "@features/board/context/useBoard";
import { useGrid } from "@features/board/hooks/useGrid";
import type { BoardButton } from "@features/board/types";
import Box from "@mui/material/Box";
import { useSpeech } from "@shared/contexts/SpeechProvider/SpeechProvider";
import { useNavigate, useParams } from "react-router";

export function Board() {
  const speech = useSpeech();
  const board = useBoard();
  const navigate = useNavigate();
  const { setId } = useParams<{ setId: string; boardId: string }>();

  const grid = useGrid(
    board.board?.buttons ?? [],
    board.board?.grid ?? { rows: 0, columns: 0 }
  );

  // Helper function to resolve board ID from path using manifest
  const resolveBoardId = async (
    loadBoard: { id?: string; path?: string }
  ): Promise<string | null> => {
    if (loadBoard.id) {
      return loadBoard.id;
    }

    if (loadBoard.path && setId) {
      try {
        const { getManifestJson, openBoardsDb } = await import(
          "@features/board/db/boards-db"
        );
        const db = await openBoardsDb();
        try {
          const manifest = await getManifestJson<{
            paths: { boards: Record<string, string> };
          }>(db, setId);

          if (manifest?.paths?.boards) {
            // Create reverse mapping: path → id
            for (const [id, path] of Object.entries(manifest.paths.boards)) {
              if (path === loadBoard.path) {
                return id;
              }
            }
          }
        } finally {
          db.close();
        }
      } catch (err) {
        console.error("Error resolving board path to ID:", err);
      }
    }

    return null;
  };

  console.log("Board component render:", {
    board: board.board,
    grid: grid.grid,
  });

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

  if (!board.board) {
    return <Box sx={{ p: 4, textAlign: "center" }}>No board loaded</Box>;
  }

  console.log("Rendering grid with:", grid.grid.length, "rows");

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
                ? board.board?.images?.find((img) => img.id === button.imageId)
                    ?.data
                : undefined
            }
            onClick={async () => {
              // Handle loadBoard action - navigate to new board URL
              if (button.loadBoard && setId) {
                const boardId = await resolveBoardId(button.loadBoard);
                if (boardId) {
                  console.log("Navigating to board:", boardId);
                  navigate(`/sets/${setId}/boards/${boardId}`);
                  return;
                } else {
                  console.error(
                    "Could not resolve board ID from loadBoard:",
                    button.loadBoard
                  );
                }
              }

              // Handle other actions
              const hasActions =
                button.action ?? (button.actions && button.actions.length > 0);

              if (hasActions) {
                return;
              }

              // Default: add word to output
              board.addWord({
                ...button,
                image: button.imageId
                  ? board.board?.images?.find(
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
