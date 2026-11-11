import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import useMediaQuery from "@mui/material/useMediaQuery";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { safeAreaGutter, safeAreaInset } from "@shared/theme/safe-area";
import { useRef } from "react";
import { createButtonActivator } from "./activation/button-activator";
import type { Board, BoardButton } from "./board-types";
import { Grid, type GridItemProps } from "./grid/grid";
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

  // On a small screen the buttons move to the bottom bar, which leaves this row
  // with nothing to show unless suggestions are available. Its padding would
  // otherwise leave an empty strip above the grid.
  const isActionRowVisible = !isSmallScreen || suggestions.isSupported;

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

        {isActionRowVisible && (
          <Stack
            {...scanGroupProps}
            direction="row"
            spacing={2}
            sx={{
              justifyContent: "space-between",
              px: { xs: 2, sm: 3 },
              // The grid scrolls right under this row, and scrolled tiles keep
              // 8px clear of what it holds. On a wide screen that is buttons as
              // tall as the row, so all 8px go below it; the grid's own 16px
              // then brings the space under the row to the page margin, the
              // same as above it. A small screen shows only suggestions, which
              // sit 4px inside the row: 4px more on each side gives them the
              // same room and keeps the space around them even.
              pt: { xs: 0.5, sm: 0 },
              pb: { xs: 0.5, sm: 1 },
            }}
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
        )}

        <Box sx={{ flex: 1, minHeight: 0 }}>
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
          <Stack
            {...scanGroupProps}
            direction="row"
            sx={(theme) => ({
              justifyContent: "space-between",
              gap: 2,
              px: 2,
              // The grid scrolls right above the buttons; the top padding
              // keeps scrolled tiles from touching them.
              pt: 1,
              pb: safeAreaGutter(theme.spacing(1), "bottom"),
            })}
          >
            {navigationButtons}
            {backspaceButton}
          </Stack>
        )}
      </Stack>
    </ScanningScope>
  );
}
