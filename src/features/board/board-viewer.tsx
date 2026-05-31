import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { m } from "@paraglide/messages.js";
import { useLanguage } from "@shared/language/use-language";
import { usePlaybackConfig } from "@shared/playback/playback-store";
import { useButtonActivation } from "./activation/use-button-activation";
import { Grid, type GridItemProps } from "./grid/grid";
import { useBoardKeyboard } from "./keyboard/use-board-keyboard";
import { MessageBar } from "./message/message-bar";
import { useMessage } from "./message/use-message";
import { useMessagePlayback } from "./message/use-message-playback";
import { NavButtons } from "./navigation/nav-buttons";
import { useBoardNavigation } from "./navigation/use-board-navigation";
import { SuggestionBar } from "./suggestions/suggestion-bar";
import { useSuggestions } from "./suggestions/use-suggestions";
import { Tile } from "./tile/tile";
import type { Board, BoardButton } from "./types";

export interface BoardViewerProps {
  board: Board;
}

export function BoardViewer({ board }: BoardViewerProps) {
  const { direction } = useLanguage();
  const { highlightActivePart } = usePlaybackConfig();
  const message = useMessage();
  const playback = useMessagePlayback(message.parts);
  const suggestions = useSuggestions(message.text);
  const navigation = useBoardNavigation();

  const { activateButton } = useButtonActivation({
    message,
    playback,
    navigation,
  });

  const keyboard = useBoardKeyboard({ message, playback });

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
      {...keyboard.rootProps}
      direction="column"
      sx={[
        { height: "100%" },
        (theme) =>
          theme.applyStyles("dark", {
            backgroundRepeat: "no-repeat",
            backgroundImage:
              "radial-gradient(80% 50% at 50% -20%, rgb(0, 41, 82), transparent)",
          }),
        (theme) => ({
          [theme.breakpoints.up("sm")]: {
            pl: "env(safe-area-inset-left)",
            pr: "env(safe-area-inset-right)",
          },
        }),
      ]}
    >
      <MessageBar
        parts={message.parts}
        activePartId={highlightActivePart ? playback.activePartId : null}
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
          ariaLabel={board.name ?? m.boardGridLabel()}
          items={board.buttons}
          rows={board.grid.rows}
          columns={board.grid.columns}
          order={board.grid.order}
          renderItem={renderTile}
          dir={direction}
        />
      </Box>
    </Stack>
  );
}
