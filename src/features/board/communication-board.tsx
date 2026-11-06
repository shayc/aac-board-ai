import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import useMediaQuery from "@mui/material/useMediaQuery";
import { m } from "@paraglide/messages.js";
import { PerfProfiler, usePerfSpan } from "@perf";
import { useTranslate } from "@shared/language/use-translate";
import { safeAreaInset } from "@shared/theme/safe-area";
import { useRef, type CSSProperties } from "react";
import { AACSymbol } from "./aac-symbol/aac-symbol";
import { createButtonActivator } from "./activation/button-activator";
import { useBoardPreferences } from "./board-preferences-store";
import type { Board, BoardButton } from "./board-types";
import { Grid, type GridItemProps } from "./grid/grid";
import { useBoardShortcuts } from "./shortcuts/use-board-shortcuts";
import { BackspaceButton } from "./message/backspace-button";
import { useMessage } from "./message/use-message";
import { NavigationButtons } from "./navigation/navigation-buttons";
import { useBoardNavigation } from "./navigation/use-board-navigation";
import { PlaybackMessageBar } from "./playback/playback-message-bar";
import { useBoardPlayback } from "./playback/use-board-playback";
import { SuggestionBar } from "./suggestions/suggestion-bar";
import { useMessageSuggestions } from "./suggestions/use-message-suggestions";
import { Tile } from "./tile/tile";

interface CommunicationBoardProps {
  board: Board;
}

type BoardRootStyle = CSSProperties & {
  "--tile-saturation": string;
};

export function CommunicationBoard({ board }: CommunicationBoardProps) {
  const t = useTranslate();

  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));
  const { tileSaturation, areTileBordersVisible, tileLabelPlacement } =
    useBoardPreferences();

  const message = useMessage();
  const addTileSpan = usePerfSpan("flow:message:add-tile", message.parts);
  const suggestions = useMessageSuggestions(message.text);

  const playback = useBoardPlayback();

  const navigation = useBoardNavigation();
  const gridViewportRef = useRef<HTMLDivElement>(null);

  const activateButton = createButtonActivator({
    message,
    playback,
    navigation,
  });
  const shortcuts = useBoardShortcuts({ message, playback });

  const hasMessage = message.parts.length > 0;
  const isInBoardSet = Boolean(navigation.boardSetId);

  const boardRootStyle: BoardRootStyle = {
    "--tile-saturation": String(tileSaturation),
  };

  function handleHome() {
    if (navigation.isHome) {
      scrollGridToOrigin();
    }

    navigation.goHome();
  }

  function scrollGridToOrigin() {
    gridViewportRef.current?.scrollTo({ left: 0, top: 0 });
  }

  function activateTile(button: BoardButton) {
    if (!button.linkedBoardId) {
      addTileSpan.start();
    }

    activateButton(button);
  }

  const renderTile = (button: BoardButton, gridItemProps: GridItemProps) => {
    return (
      <PerfProfiler key={`${board.id}/${button.id}`} id="Tile">
        <Tile
          ariaLabel={button.label ? undefined : button.vocalization}
          backgroundColor={button.backgroundColor}
          borderColor={button.borderColor}
          variant={button.linkedBoardId ? "folder" : undefined}
          isBorderVisible={areTileBordersVisible}
          onActivate={() => activateTile(button)}
          {...gridItemProps}
        >
          <AACSymbol
            label={button.label}
            imageSrc={button.imageSrc}
            labelPlacement={tileLabelPlacement}
          />
        </Tile>
      </PerfProfiler>
    );
  };

  return (
    <Stack
      {...shortcuts.rootProps}
      direction="column"
      style={boardRootStyle}
      sx={{
        height: "100%",
        pl: { sm: safeAreaInset("left") },
        pr: { sm: safeAreaInset("right") },
      }}
    >
      <PerfProfiler id="MessageBar">
        <PlaybackMessageBar parts={message.parts} playback={playback} />
      </PerfProfiler>

      <Stack
        direction="row"
        spacing={2}
        sx={{ justifyContent: "space-between", px: { xs: 2, sm: 3 } }}
      >
        <Stack direction="row" spacing={2} sx={{ flex: 1, minWidth: 0 }}>
          {!isSmallScreen && isInBoardSet && (
            <NavigationButtons
              canGoBack={navigation.canGoBack}
              canGoHome={navigation.canGoHome}
              onBack={navigation.goBack}
              onHome={handleHome}
            />
          )}

          {suggestions.isSupported && (
            <SuggestionBar
              status={suggestions.status}
              phrases={suggestions.phrases}
              onEnable={suggestions.enable}
              onPhraseSelect={message.replaceWithText}
            />
          )}
        </Stack>

        {!isSmallScreen && (
          <BackspaceButton
            disabled={!hasMessage}
            onPress={message.backspace}
            onLongPress={message.clear}
          />
        )}
      </Stack>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <PerfProfiler id="Grid">
          <Grid<BoardButton>
            ref={gridViewportRef}
            ariaLabel={board.name || t(m.boardGridLabel)}
            items={board.buttons}
            rows={board.grid.rows}
            columns={board.grid.columns}
            order={board.grid.order}
            renderItem={renderTile}
          />
        </PerfProfiler>
      </Box>

      {isSmallScreen && (
        <Toolbar
          sx={{
            alignItems: "flex-end",
            justifyContent: isInBoardSet ? "space-between" : "flex-end",
            gap: 2,
            pb: safeAreaInset("bottom"),
          }}
        >
          {isInBoardSet && (
            <NavigationButtons
              canGoBack={navigation.canGoBack}
              canGoHome={navigation.canGoHome}
              onBack={navigation.goBack}
              onHome={handleHome}
            />
          )}

          <BackspaceButton
            disabled={!hasMessage}
            onPress={message.backspace}
            onLongPress={message.clear}
          />
        </Toolbar>
      )}
    </Stack>
  );
}
