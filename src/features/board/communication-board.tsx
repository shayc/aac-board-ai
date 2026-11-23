import type { Board, BoardButton } from "@features/library";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import useMediaQuery from "@mui/material/useMediaQuery";
import { m } from "@paraglide/messages.js";
import { useCommunicationLanguage } from "@shared/language/language-store";
import { useTranslate } from "@shared/language/use-translate";
import { DirectionalThemeProvider } from "@shared/theme/directional-theme-provider";
import { maxSafeAreaGutter, safeAreaInset } from "@shared/theme/safe-area";
import { shortLandscape } from "@shared/theme/short-landscape";
import { ErrorBoundary } from "@shared/ui/error-boundary";
import {
  BOTTOM_CONTROLS_INSET,
  PAGE_MARGIN,
  SCROLL_CLEARANCE,
} from "./board-spacing";
import { Grid, type GridItemProps } from "./grid/grid";
import { BackspaceButton } from "./message/backspace-button";
import type { Message } from "./message/message";
import { MessageBar } from "./message/message-bar";
import { useMessagePreferences } from "./message/message-preferences-store";
import { useMessage } from "./message/use-message";
import { HomeButton } from "./navigation/home-button";
import { useBoardNavigation } from "./navigation/use-board-navigation";
import { PlayButton } from "./playback/play-button";
import { useBoardPlayback } from "./playback/use-board-playback";
import { scanGroupProps, scanRowProps } from "./scanning/scan-targets";
import { ScanningScope } from "./scanning/scanning-scope";
import { useBoardShortcutLabels } from "./shortcuts/use-board-shortcut-labels";
import { useBoardShortcuts } from "./shortcuts/use-board-shortcuts";
import { MessageSuggestions } from "./suggestions/message-suggestions";
import { Tile } from "./tile/tile";
import { createTileActivator } from "./tile/tile-activation";

interface CommunicationBoardProps {
  board: Board;
  /** The language the board's text is in, when known; it may not be the communication language. */
  boardLanguage: string | undefined;
  rootBoardId: string | undefined;
  initialMessage?: Message;
}

export function CommunicationBoard({
  board,
  boardLanguage,
  rootBoardId,
  initialMessage,
}: CommunicationBoardProps) {
  const t = useTranslate();
  const { language, direction } = useCommunicationLanguage();
  const isNarrowScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));
  const isShortLandscape = useMediaQuery(shortLandscape);

  const playback = useBoardPlayback();
  const message = useMessage(playback.playMessage, initialMessage);
  const { shouldPlayTiles } = useMessagePreferences();
  const navigation = useBoardNavigation(rootBoardId);
  const shortcuts = useBoardShortcuts({ message, playback });
  const shortcutLabels = useBoardShortcutLabels();

  // Pass individual members so message edits do not re-render every tile.
  const activateTile = createTileActivator({
    message: {
      apply: message.apply,
      play: message.play,
      echo: message.echo,
    },
    playback: { playTile: playback.playTile, stop: playback.stop },
    navigation: { goToBoard: navigation.goToBoard, goHome: navigation.goHome },
    boardLanguage,
    shouldPlayTiles,
  });

  const areControlsBelowGrid = isNarrowScreen && !isShortLandscape;
  const pageMargin = isShortLandscape ? PAGE_MARGIN.xs : PAGE_MARGIN;
  const scrollClearance = isShortLandscape
    ? SCROLL_CLEARANCE.xs
    : SCROLL_CLEARANCE;

  const hasMessage = message.parts.length > 0;

  const homeButton = (
    <HomeButton
      disabled={!navigation.canGoHome}
      shape={areControlsBelowGrid ? "pill" : "round"}
      onClick={navigation.goHome}
    />
  );

  const backspaceButton = (
    <BackspaceButton
      disabled={!hasMessage}
      shortcutLabels={shortcutLabels}
      onPress={message.backspace}
      onLongPress={message.clear}
    />
  );

  const playButton = (
    <PlayButton
      disabled={!playback.isMessagePlaying && !hasMessage}
      isPlaying={playback.isMessagePlaying}
      shape={areControlsBelowGrid ? "pill" : "round"}
      shortcutLabels={shortcutLabels}
      onPlay={() => void message.play()}
      onStop={playback.stop}
    />
  );

  const renderTile = (button: BoardButton, gridItemProps: GridItemProps) => (
    <Tile
      button={button}
      language={boardLanguage}
      onActivate={activateTile}
      {...gridItemProps}
    />
  );

  return (
    <DirectionalThemeProvider direction={direction}>
      <ScanningScope>
        <Stack
          {...shortcuts.rootProps}
          dir={direction}
          direction="column"
          sx={{
            height: "100%",
            pl: { sm: safeAreaInset("left") },
            pr: { sm: safeAreaInset("right") },
          }}
        >
          <Stack spacing={pageMargin} sx={{ pt: pageMargin, px: pageMargin }}>
            <Stack
              {...scanGroupProps}
              direction="row"
              spacing={2}
              sx={{ alignItems: "center" }}
            >
              {!areControlsBelowGrid && homeButton}

              <MessageBar
                parts={message.parts}
                isWordOpen={message.isWordOpen}
                endAction={
                  <>
                    {backspaceButton}
                    {!areControlsBelowGrid && playButton}
                  </>
                }
              />
            </Stack>

            <Stack
              {...scanGroupProps}
              direction="row"
              sx={{ "&:empty": { display: "none" } }}
            >
              <ErrorBoundary fallback={null}>
                <MessageSuggestions
                  messageText={message.text}
                  language={language}
                  onPhraseSelect={(phrase) =>
                    message.replaceWithText(phrase, language)
                  }
                />
              </ErrorBoundary>
            </Stack>
          </Stack>

          <Box sx={{ flex: 1, minHeight: 0, py: scrollClearance }}>
            <Grid<BoardButton>
              aria-label={board.name || t(m.boardGridLabel)}
              items={board.buttons}
              order={board.grid.order}
              rowProps={scanRowProps}
              getItemKey={(button) => `${board.id}/${button.id}`}
              renderItem={renderTile}
            />
          </Box>

          {areControlsBelowGrid && (
            <Stack
              {...scanGroupProps}
              direction="row"
              spacing={2}
              sx={(theme) => ({
                justifyContent: "space-between",
                px: BOTTOM_CONTROLS_INSET,
                pb: maxSafeAreaGutter(theme.spacing(PAGE_MARGIN.xs), "bottom"),
              })}
            >
              {homeButton}
              {playButton}
            </Stack>
          )}
        </Stack>
      </ScanningScope>
    </DirectionalThemeProvider>
  );
}
