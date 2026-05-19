import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useLanguage } from "@shared/language/use-language";
import { Grid, type GridItemProps } from "./grid/grid";
import { MessageBar } from "./message/message-bar";
import { useMessage } from "./message/use-message";
import { useMessagePlayback } from "./message/use-message-playback";
import { NavButtons } from "./navigation/nav-buttons";
import { useBoardNavigation } from "./navigation/use-board-navigation";
import { SuggestionBar } from "./suggestions/suggestion-bar";
import { useSuggestions } from "./suggestions/use-suggestions";
import { Tile } from "./tile/tile";
import type { Board, BoardButton } from "./types";
import { useButtonActivation } from "./use-button-activation";

export interface BoardViewerProps {
  board: Board;
}

export function BoardViewer({ board }: BoardViewerProps) {
  const { direction } = useLanguage();
  const message = useMessage();
  const playback = useMessagePlayback(message.parts);
  const suggestions = useSuggestions(message.text);
  const navigation = useBoardNavigation();

  const { activateButton } = useButtonActivation({
    message,
    playback,
    navigation,
  });

  const renderTile = (button: BoardButton, props: GridItemProps) => (
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
  );

  return (
    <Stack
      direction="column"
      sx={(theme) => ({
        height: "100%",
        backgroundRepeat: "no-repeat",
        backgroundImage:
          theme.palette.mode === "dark"
            ? "radial-gradient(80% 50% at 50% -20%, rgb(0, 41, 82), transparent)"
            : "radial-gradient(80% 50% at 50% -20%, rgb(204, 230, 255), transparent)",
      })}
    >
      <MessageBar
        parts={message.parts}
        isPlaying={playback.isPlaying}
        onBackspacePress={message.removeLastPart}
        onBackspaceLongPress={message.clear}
        onPlayClick={() => void playback.play()}
        onStopClick={playback.stop}
      />

      <Stack
        direction="row"
        spacing={2}
        sx={{ justifyContent: "space-between", px: 2 }}
      >
        <NavButtons
          canGoBack={navigation.canGoBack}
          canGoHome={navigation.canGoHome}
          onBackClick={navigation.goBack}
          onHomeClick={navigation.goHome}
        />

        {suggestions.isSupported && (
          <SuggestionBar
            suggestions={suggestions.phrases}
            tone={suggestions.tone}
            onToneChange={suggestions.setTone}
            onSuggestionClick={message.setFromText}
          />
        )}
      </Stack>

      <Box sx={{ flexGrow: 1, height: 0, overflow: "auto" }}>
        <Grid<BoardButton>
          rows={board.grid.rows}
          columns={board.grid.columns}
          order={board.grid.order}
          items={board.buttons}
          renderItem={renderTile}
          dir={direction}
        />
      </Box>
    </Stack>
  );
}
