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
  const {
    board,
    activateButton,
    canGoBack,
    canGoHome,
    navigateBack,
    navigateHome,
    isSuggestionsEnabled,
    message,
    isPlayingMessage,
    removeLastPart,
    clearMessage,
    playMessage,
    stopMessage,
    suggestions,
    suggestionTone,
    setSuggestionTone,
    setMessage,
  } = useBoard();

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
        message={message}
        isPlaying={isPlayingMessage}
        onBackspacePress={removeLastPart}
        onBackspaceLongPress={clearMessage}
        onPlayClick={() => void playMessage()}
        onStopClick={stopMessage}
      />

      <Stack direction="row" justifyContent="space-between" spacing={2} px={2}>
        <NavButtons
          canGoBack={canGoBack}
          canGoHome={canGoHome}
          onBackClick={navigateBack}
          onHomeClick={navigateHome}
        />

        {isSuggestionsEnabled && (
          <SuggestionBar
            suggestions={suggestions}
            tone={suggestionTone}
            onToneChange={setSuggestionTone}
            onSuggestionClick={(suggestion) => {
              setMessage([{ id: suggestion, label: suggestion }]);
            }}
          />
        )}
      </Stack>
      <Box sx={{ flexGrow: 1, overflow: "auto" }}>
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
