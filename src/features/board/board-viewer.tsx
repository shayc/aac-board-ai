import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { Theme } from "@mui/material/styles";
import Toolbar from "@mui/material/Toolbar";
import useMediaQuery from "@mui/material/useMediaQuery";
import { m } from "@paraglide/messages.js";
import { useHighlightConfig } from "@shared/highlight/highlight-store";
import { useLanguage } from "@shared/language/use-language";
import { SwitchScanningBoundary } from "@shared/switch-scanning/switch-scanning-boundary";
import { switchScanningSx } from "@shared/switch-scanning/switch-scanning-presentation";
import { safeAreaInset } from "@shared/theme/safe-area";
import { useTileColorConfig } from "@shared/tile-color/tile-color-store";
import { useRef } from "react";
import { createButtonActivation } from "./activation/button-activation";
import {
  ScannableGridRow,
  ScannableSuggestion,
  ScannableTile,
} from "./board-scanning";
import { Grid, type GridItemProps, type GridRowProps } from "./grid/grid";
import { useBoardKeyboard } from "./keyboard/use-board-keyboard";
import { BackspaceButton } from "./message/backspace-button";
import { MessageBar } from "./message/message-bar";
import { useMessagePlayback } from "./message/playback/use-message-playback";
import { useMessage } from "./message/use-message";
import { NavButtons } from "./navigation/nav-buttons";
import { useBoardNavigation } from "./navigation/use-board-navigation";
import { SuggestionBar } from "./suggestions/suggestion-bar";
import { useSuggestions } from "./suggestions/use-suggestions";
import type { Board, BoardButton } from "./types";
import { useBoardScanning } from "./use-board-scanning";

export interface BoardViewerProps {
  board: Board;
}

const boardRootSx = (theme: Theme) => ({
  height: "100%",
  ...theme.applyStyles("dark", {
    backgroundRepeat: "no-repeat",
    backgroundImage:
      "radial-gradient(80% 50% at 50% -20%, rgb(0, 41, 82), transparent)",
  }),
  [theme.breakpoints.up("sm")]: {
    pl: safeAreaInset("left"),
    pr: safeAreaInset("right"),
  },
});

export function BoardViewer({ board }: BoardViewerProps) {
  return (
    <SwitchScanningBoundary>
      <BoardViewerContent board={board} />
    </SwitchScanningBoundary>
  );
}

function BoardViewerContent({ board }: BoardViewerProps) {
  const { direction } = useLanguage();
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));
  const { highlightActivePart } = useHighlightConfig();
  const { saturation, borderVisible } = useTileColorConfig();
  const message = useMessage();
  const playback = useMessagePlayback();
  const suggestions = useSuggestions(message.text, board);
  const navigation = useBoardNavigation();
  const gridRef = useRef<HTMLDivElement>(null);

  function scrollGridToOrigin() {
    gridRef.current?.scrollTo({ left: 0, top: 0 });
  }

  const { activateButton } = createButtonActivation({
    message,
    playback,
    navigation,
  });

  const keyboard = useBoardKeyboard({ message, playback });
  const hasMessage = message.parts.length > 0;
  const scanning = useBoardScanning({
    hasMessage,
    isPlaying: playback.isPlaying,
    navigation: {
      canGoBack: navigation.canGoBack,
      canGoHome: navigation.canGoHome,
    },
    suggestions: {
      needsActivation: suggestions.status?.kind === "needs-activation",
    },
  });

  const renderTile = (button: BoardButton, props: GridItemProps) => (
    <ScannableTile
      key={button.id}
      boardId={board.id}
      button={button}
      borderHidden={!borderVisible}
      onClick={() => activateButton(button)}
      {...props}
    />
  );
  const renderRow = (
    buttons: readonly (BoardButton | undefined)[],
    rowIndex: number,
    props: GridRowProps,
  ) => (
    <ScannableGridRow
      boardId={board.id}
      buttons={buttons}
      rowIndex={rowIndex}
      {...props}
    />
  );
  const renderSuggestion = (phrase: string, onClick: () => void) => (
    <ScannableSuggestion boardId={board.id} phrase={phrase} onClick={onClick} />
  );

  return (
    <Stack
      {...keyboard.rootProps}
      data-switch-scanning-scope=""
      direction="column"
      sx={[
        boardRootSx,
        switchScanningSx,
        { "--tile-saturation": String(saturation) },
      ]}
    >
      <MessageBar
        parts={message.parts}
        activePartId={highlightActivePart ? playback.activePartId : null}
        isPlaying={playback.isPlaying}
        playDisabled={!hasMessage}
        slotProps={{ playButton: scanning.playTarget }}
        onPlayClick={() => void playback.play(message.parts)}
        onStopClick={playback.stop}
      />

      <Stack
        direction="row"
        spacing={2}
        sx={{ justifyContent: "space-between", px: { xs: 2, sm: 3 } }}
      >
        <Stack direction="row" spacing={2}>
          {!isSmallScreen && (
            <NavButtons
              onHomeClick={navigation.isHome ? scrollGridToOrigin : undefined}
              slotProps={{
                backButton: scanning.backTarget,
                homeButton: scanning.homeTarget,
              }}
            />
          )}

          {suggestions.isSupported && (
            <SuggestionBar
              status={suggestions.status}
              phrases={suggestions.phrases}
              slotProps={{ enableButton: scanning.suggestionsEnableTarget }}
              renderPhrase={renderSuggestion}
              onEnable={suggestions.enable}
              onPhraseClick={message.setFromText}
            />
          )}
        </Stack>

        {!isSmallScreen && (
          <BackspaceButton
            {...scanning.backspaceTarget}
            disabled={!hasMessage}
            onPress={message.removeLastPart}
            onLongPress={message.clear}
          />
        )}
      </Stack>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <Grid<BoardButton>
          ref={gridRef}
          ariaLabel={board.name ?? m.boardGridLabel()}
          items={board.buttons}
          rows={board.grid.rows}
          columns={board.grid.columns}
          order={board.grid.order}
          renderItem={renderTile}
          renderRow={renderRow}
          dir={direction}
        />
      </Box>

      {isSmallScreen && (
        <Toolbar
          sx={{
            justifyContent: "space-between",
            gap: 2,
            px: { xs: 3 },
            pb: safeAreaInset("bottom"),
          }}
        >
          <NavButtons
            onHomeClick={navigation.isHome ? scrollGridToOrigin : undefined}
            slotProps={{
              backButton: scanning.backTarget,
              homeButton: scanning.homeTarget,
            }}
          />

          <BackspaceButton
            {...scanning.backspaceTarget}
            disabled={!hasMessage}
            onPress={message.removeLastPart}
            onLongPress={message.clear}
          />
        </Toolbar>
      )}
    </Stack>
  );
}
