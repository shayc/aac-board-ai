import type { LoadBoard, Manifest } from "@/shared/lib/open-board-format";
import { Grid } from "@features/board/components/Grid/Grid";
import { MessageBar } from "@/features/board/components/MessageBar/MessageBar";
import { SuggestionBar } from "@features/board/components/SuggestionBar/SuggestionBar";
import { Tile } from "@features/board/components/Tile/Tile";
import { useBoard } from "@features/board/context/useBoard";
import type { BoardButton } from "@features/board/types";
import Box from "@mui/material/Box";
import { useSpeech } from "@shared/contexts/SpeechProvider/SpeechProvider";
import { useParams } from "react-router";

export function Board() {
  const speech = useSpeech();
  const { board, navigation, suggestions, message } = useBoard();
  const { setId } = useParams<{ setId: string; boardId: string }>();

  const resolveBoardId = async (
    loadBoard: LoadBoard
  ): Promise<string | null> => {
    if (loadBoard.id) {
      return loadBoard.id;
    }

    if (loadBoard.path && setId) {
      try {
        const { getManifestJson, openBoardsDB: openBoardsDb } = await import(
          "@features/board/db/boards-db"
        );

        const db = await openBoardsDb();

        try {
          const manifest = await getManifestJson<Manifest>(db, setId);

          if (manifest?.paths?.boards) {
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

    console.log("🔍 DEBUG - No board ID resolved, returning null");
    return null;
  };

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
      <MessageBar
        parts={message.parts}
        onClearClick={() => message.clear()}
        onPlayClick={() => message.play()}
      />

      <SuggestionBar
        suggestions={suggestions.suggestions}
        onToneChange={suggestions.changeTone}
      />

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
            imageSrc={
              button.imageId
                ? board.current?.images?.find(
                    (img) => img.id === button.imageId
                  )?.data
                : undefined
            }
            onClick={async () => {
              if (button.loadBoard && setId) {
                const boardId = await resolveBoardId(button.loadBoard);

                if (boardId) {
                  navigation.goToBoard(boardId);
                  return;
                } else {
                  console.error(
                    "Could not resolve board ID from loadBoard:",
                    button.loadBoard
                  );
                }
              }

              const hasActions =
                button.action ?? (button.actions && button.actions.length > 0);

              if (hasActions) {
                return;
              }

              message.appendPart({
                ...button,
                image: button.imageId
                  ? board.current?.images?.find(
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
