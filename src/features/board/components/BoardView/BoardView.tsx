import { Grid } from "@features/board/components/Grid/Grid";
import { MessageBar } from "@features/board/components/MessageBar/MessageBar";
import { NavButtons } from "@features/board/components/NavButtons/NavButtons";
import { SuggestionBar } from "@features/board/components/SuggestionBar/SuggestionBar";
import { Tile } from "@features/board/components/Tile/Tile";
import { useBoardNavigation } from "@features/board/hooks/useBoardNavigation";
import { useButtonActivation } from "@features/board/hooks/useButtonActivation";
import { useMessage } from "@features/board/hooks/useMessage";
import { useSuggestions } from "@features/board/hooks/useSuggestions";
import type { Board, BoardButton } from "@features/board/types";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

export interface BoardViewProps {
  board: Board;
}

export function BoardView({ board }: BoardViewProps) {
  const message = useMessage();
  const suggestions = useSuggestions(message.text);
  const navigation = useBoardNavigation();
  const { activateButton } = useButtonActivation({ message, navigation });

  function applySuggestion(suggestion: string) {
    const words = suggestion.split(/\s+/).filter(Boolean);
    const parts = words.map((word) => ({
      id: crypto.randomUUID(),
      label: word,
    }));

    message.setParts(parts);
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
      <MessageBar
        message={message.parts}
        isPlaying={message.isPlaying}
        onBackspacePress={message.removeLastPart}
        onBackspaceLongPress={message.clear}
        onPlayClick={() => void message.play()}
        onStopClick={message.stop}
      />

      <Stack direction="row" justifyContent="space-between" spacing={2} px={2}>
        <NavButtons
          canGoBack={navigation.canGoBack}
          canGoHome={navigation.canGoHome}
          onBackClick={navigation.goBack}
          onHomeClick={navigation.goHome}
        />

        {suggestions.isAvailable && (
          <SuggestionBar
            suggestions={suggestions.items}
            tone={suggestions.tone}
            onToneChange={suggestions.setTone}
            onSuggestionClick={applySuggestion}
          />
        )}
      </Stack>

      <Box sx={{ flexGrow: 1, height: 0, overflow: "auto" }}>
        <Grid<BoardButton>
          rows={board.grid.rows}
          columns={board.grid.columns}
          order={board.grid.order}
          items={board.buttons}
          renderItem={(button, props) => (
            <Tile
              key={button.id}
              label={button.label}
              imageSrc={button.imageSrc}
              backgroundColor={button.backgroundColor}
              borderColor={button.borderColor}
              variant={button.loadBoard ? "folder" : undefined}
              onClick={() => void activateButton(button)}
              {...props}
            />
          )}
        />
      </Box>
    </Stack>
  );
}
