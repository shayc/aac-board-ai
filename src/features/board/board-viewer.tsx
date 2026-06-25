import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { Theme } from "@mui/material/styles";
import { useRef } from "react";
import { m } from "@paraglide/messages.js";
import { useLanguage } from "@shared/language/use-language";
import { usePlaybackConfig } from "@shared/playback/playback-store";
import { createButtonActivation } from "./activation/button-activation";
import { getNavigationTargetId } from "./board-button";
import { Grid, type GridHandle, type GridItemProps } from "./grid/grid";
import { useBoardKeyboard } from "./keyboard/use-board-keyboard";
import { MessageBar } from "./message/message-bar";
import { useMessagePlayback } from "./message/playback/use-message-playback";
import { useMessage } from "./message/use-message";
import { NavButtons } from "./navigation/nav-buttons";
import { useBoardNavigation } from "./navigation/use-board-navigation";
import { SuggestionBar } from "./suggestions/suggestion-bar";
import { useSuggestions } from "./suggestions/use-suggestions";
import { Tile } from "./tile/tile";
import type { Board, BoardButton } from "./types";

export interface BoardViewerProps {
  board: Board;
}

const rootSx = (theme: Theme) => ({
  height: "100%",
  ...theme.applyStyles("dark", {
    backgroundRepeat: "no-repeat",
    backgroundImage:
      "radial-gradient(80% 50% at 50% -20%, rgb(0, 41, 82), transparent)",
  }),
  [theme.breakpoints.up("sm")]: {
    pl: "env(safe-area-inset-left)",
    pr: "env(safe-area-inset-right)",
  },
});

export function BoardViewer({ board }: BoardViewerProps) {
  const { direction } = useLanguage();
  const { highlightActivePart } = usePlaybackConfig();
  const message = useMessage();
  const playback = useMessagePlayback(message.parts);
  const suggestions = useSuggestions(message.text);
  const navigation = useBoardNavigation();

  const { activateButton } = createButtonActivation({
    message,
    playback,
    navigation,
  });

  const keyboard = useBoardKeyboard({ message, playback });

  const gridRef = useRef<GridHandle>(null);

  const handleHomeClick = () => {
    if (navigation.isHome) {
      gridRef.current?.scrollToStart();
    } else {
      navigation.goHome();
    }
  };

  const renderTile = (button: BoardButton, props: GridItemProps) => (
    <Tile
      key={button.id}
      label={button.label}
      imageSrc={button.imageSrc}
      backgroundColor={button.backgroundColor}
      borderColor={button.borderColor}
      variant={getNavigationTargetId(button) ? "folder" : undefined}
      onClick={() => void activateButton(button)}
      {...props}
    />
  );

  return (
    <Stack {...keyboard.rootProps} direction="column" sx={rootSx}>
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
        sx={{ justifyContent: "space-between", px: 3 }}
      >
        <NavButtons
          canGoBack={navigation.canGoBack}
          canGoHome={navigation.canGoHome}
          onBackClick={navigation.goBack}
          onHomeClick={handleHomeClick}
        />

        {suggestions.isSupported && (
          <SuggestionBar
            phrases={suggestions.phrases}
            status={suggestions.status}
            tone={suggestions.tone}
            canChangeTone={suggestions.canChangeTone}
            onPhraseClick={message.setFromText}
            onToneChange={suggestions.setTone}
            onEnable={suggestions.enable}
          />
        )}
      </Stack>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <Grid<BoardButton>
          ariaLabel={board.name ?? m.boardGridLabel()}
          items={board.buttons}
          rows={board.grid.rows}
          columns={board.grid.columns}
          order={board.grid.order}
          renderItem={renderTile}
          dir={direction}
          ref={gridRef}
        />
      </Box>
    </Stack>
  );
}
