import {
  Grid,
  MessageBar,
  NavButtons,
  SuggestionBar,
  Tile,
} from "@features/board/components";
import { useBoard } from "@features/board/context/useBoard";
import type { BoardButton } from "@features/board/types";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

export function Board() {
  const { board, message, suggestions, navigation, activateButton } =
    useBoard();

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

        {suggestions.isEnabled && (
          <SuggestionBar
            suggestions={suggestions.items}
            tone={suggestions.tone}
            onToneChange={suggestions.setTone}
            onSuggestionClick={(suggestion) => {
              const words = suggestion.split(/\s+/).filter(Boolean);
              const parts = words.map((word) => ({
                id: crypto.randomUUID(),
                label: word,
              }));
              message.setParts(parts);
            }}
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
