import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import useMediaQuery from "@mui/material/useMediaQuery";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { safeAreaInset } from "@shared/theme/safe-area";
import { useRef } from "react";
import { createButtonActivator } from "./activation/button-activator";
import type { Board, BoardButton } from "./board-types";
import { Grid, type GridItemProps } from "./grid/grid";
import { GRID_MIN_VIEWPORT_HEIGHT } from "./grid/grid-layout";
import { useBoardShortcuts } from "./shortcuts/use-board-shortcuts";
import { BackspaceButton } from "./message/backspace-button";
import { useMessage } from "./message/use-message";
import { NavigationButtons } from "./navigation/navigation-buttons";
import { useBoardNavigation } from "./navigation/use-board-navigation";
import { PlaybackMessageBar } from "./playback/playback-message-bar";
import { useBoardPlayback } from "./playback/use-board-playback";
import { scanGroupProps } from "./scanning/scan-targets";
import { ScanningScope } from "./scanning/scanning-scope";
import { SuggestionBar } from "./suggestions/suggestion-bar";
import { useMessageSuggestions } from "./suggestions/use-message-suggestions";
import { Tile } from "./tile/tile";

interface CommunicationBoardProps {
  board: Board;
  rootBoardId: string | undefined;
}

export function CommunicationBoard({
  board,
  rootBoardId,
}: CommunicationBoardProps) {
  const t = useTranslate();

  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));

  const message = useMessage();
  const suggestions = useMessageSuggestions(message.text);

  const playback = useBoardPlayback();

  const navigation = useBoardNavigation(rootBoardId);
  const gridViewportRef = useRef<HTMLDivElement>(null);

  // Only the callbacks it calls. The hook results also carry state, so they
  // change identity when the message changes or its playback starts or stops,
  // which would rebuild the activator and re-render every tile.
  const activateButton = createButtonActivator({
    message: { getParts: message.getParts, setParts: message.setParts },
    playback: {
      playMessage: playback.playMessage,
      playPart: playback.playPart,
    },
    navigation: { goToBoard: navigation.goToBoard, goHome: navigation.goHome },
  });
  const shortcuts = useBoardShortcuts({ message, playback });

  const hasMessage = message.parts.length > 0;

  function handleHome() {
    if (navigation.isHome) {
      scrollGridToOrigin();
    }

    navigation.goHome();
  }

  function scrollGridToOrigin() {
    gridViewportRef.current?.scrollTo({ left: 0, top: 0 });
  }

  const navigationButtons = (
    <NavigationButtons
      canGoBack={navigation.canGoBack}
      canGoHome={navigation.canGoHome}
      onBack={navigation.goBack}
      onHome={handleHome}
    />
  );

  const backspaceButton = (
    <BackspaceButton
      disabled={!hasMessage}
      onPress={message.backspace}
      onLongPress={message.clear}
    />
  );

  const renderTile = (button: BoardButton, gridItemProps: GridItemProps) => (
    <Tile
      key={`${board.id}/${button.id}`}
      button={button}
      onActivate={activateButton}
      {...gridItemProps}
    />
  );

  return (
    <ScanningScope>
      <Stack
        {...shortcuts.rootProps}
        direction="column"
        sx={{
          height: "100%",
          pl: { sm: safeAreaInset("left") },
          pr: { sm: safeAreaInset("right") },
        }}
      >
        <PlaybackMessageBar parts={message.parts} playback={playback} />

        <Stack
          {...scanGroupProps}
          direction="row"
          spacing={2}
          sx={{ justifyContent: "space-between", px: { xs: 2, sm: 3 } }}
        >
          <Stack direction="row" spacing={2} sx={{ flex: 1, minWidth: 0 }}>
            {!isSmallScreen && navigationButtons}

            {suggestions.isSupported && (
              <SuggestionBar
                status={suggestions.status}
                phrases={suggestions.phrases}
                onEnable={suggestions.enable}
                onPhraseSelect={message.replaceWithText}
              />
            )}
          </Stack>

          {!isSmallScreen && backspaceButton}
        </Stack>

        <Box sx={{ flex: 1, minHeight: GRID_MIN_VIEWPORT_HEIGHT }}>
          <Grid<BoardButton>
            ref={gridViewportRef}
            ariaLabel={board.name || t(m.boardGridLabel)}
            items={board.buttons}
            rows={board.grid.rows}
            columns={board.grid.columns}
            order={board.grid.order}
            renderItem={renderTile}
          />
        </Box>

        {isSmallScreen && (
          <Toolbar
            {...scanGroupProps}
            sx={{
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 2,
              pb: safeAreaInset("bottom"),
            }}
          >
            {navigationButtons}
            {backspaceButton}
          </Toolbar>
        )}
      </Stack>
    </ScanningScope>
  );
}
