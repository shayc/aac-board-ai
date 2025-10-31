import { Grid } from "@features/board/components/Grid/Grid";
import { MessageBar } from "@features/board/components/MessageBar/MessageBar";
import { SuggestionBar } from "@features/board/components/SuggestionBar/SuggestionBar";
import { Tile } from "@features/board/components/Tile/Tile";
import { useBoard } from "@features/board/context/useBoard";
import type { Button } from "@features/board/types";
import Stack from "@mui/material/Stack";
import { useAICapabilities } from "@shared/hooks/ai";

export function Board() {
  const { board, activateButton } = useBoard();
  const { isProofreaderSupported, isRewriterSupported } = useAICapabilities();
  const isSuggestionBarEnabled = isProofreaderSupported ?? isRewriterSupported;

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

      {isSuggestionBarEnabled && <SuggestionBar />}

      <Grid<Button>
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
            onClick={() => activateButton(button)}
          />
        )}
      />
    </Stack>
  );
}
