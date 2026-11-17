import type { Board, BoardButton } from "@features/library";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import useMediaQuery from "@mui/material/useMediaQuery";
import { m } from "@paraglide/messages.js";
import { useCommunicationLanguage } from "@shared/language/language-store";
import { useTranslate } from "@shared/language/use-translate";
import { DirectionalThemeProvider } from "@shared/theme/directional-theme-provider";
import { safeAreaGutter, safeAreaInset } from "@shared/theme/safe-area";
import { shortLandscape } from "@shared/theme/short-landscape";
import { ErrorBoundary } from "@shared/ui/error-boundary";
import { createButtonActivator } from "./activation/button-activator";
import { PAGE_MARGIN, SCROLL_CLEARANCE } from "./board-spacing";
import { Grid, type GridItemProps } from "./grid/grid";
import { BackspaceButton } from "./message/backspace-button";
import { useMessagePreferences } from "./message/message-preferences-store";
import type { Message } from "./message/message-types";
import { useMessage } from "./message/use-message";
import { NavigationButtons } from "./navigation/navigation-buttons";
import { useBoardNavigation } from "./navigation/use-board-navigation";
import { PlayButton } from "./playback/play-button";
import { PlaybackMessageBar } from "./playback/playback-message-bar";
import { useBoardPlayback } from "./playback/use-board-playback";
import { scanGroupProps } from "./scanning/scan-targets";
import { ScanningScope } from "./scanning/scanning-scope";
import { useBoardShortcutLabels } from "./shortcuts/use-board-shortcut-labels";
import { useBoardShortcuts } from "./shortcuts/use-board-shortcuts";
import { MessageSuggestions } from "./suggestions/message-suggestions";
import { Tile } from "./tile/tile";

interface CommunicationBoardProps {
  board: Board;
  /** The language the board's text is in, when known; it may not be the communication language. */
  language: string | undefined;
  rootBoardId: string | undefined;
  initialMessage?: Message;
}

export function CommunicationBoard({
  board,
  language,
  rootBoardId,
  initialMessage,
}: CommunicationBoardProps) {
  const t = useTranslate();
  const communication = useCommunicationLanguage();
  const isNarrowScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));
  const isShortLandscape = useMediaQuery(shortLandscape);

  const message = useMessage(initialMessage);
  const { shouldPlayTiles } = useMessagePreferences();
  const playback = useBoardPlayback({
    onMessagePlayback: message.trackPlayback,
  });
  const navigation = useBoardNavigation(rootBoardId);
  const shortcuts = useBoardShortcuts({ message, playback });
  const shortcutLabels = useBoardShortcutLabels();

  const activateButton = createButtonActivator({
    message: {
      apply: message.apply,
      applyIfUnchanged: message.applyIfUnchanged,
    },
    playback: {
      playMessage: playback.playMessage,
      echoMessage: playback.echoMessage,
      playPart: playback.playPart,
      stop: playback.stop,
    },
    navigation: { goToBoard: navigation.goToBoard, goHome: navigation.goHome },
    language,
    shouldPlayTiles,
  });

  // A short landscape screen has width to spare and no height.
  const areControlsBelowGrid = isNarrowScreen && !isShortLandscape;
  const isPlayInMessageBar = !areControlsBelowGrid;
  const pageMargin = isShortLandscape ? PAGE_MARGIN.xs : PAGE_MARGIN;
  const scrollClearance = isShortLandscape
    ? SCROLL_CLEARANCE.xs
    : SCROLL_CLEARANCE;

  const hasMessage = message.parts.length > 0;

  const navigationButtons = (
    <NavigationButtons
      shape={areControlsBelowGrid ? "pill" : "round"}
      canGoBack={navigation.canGoBack}
      canGoHome={navigation.canGoHome}
      onBack={navigation.goBack}
      onHome={navigation.goHome}
    />
  );

  const backspaceButton = (
    <BackspaceButton
      disabled={!hasMessage}
      size={isPlayInMessageBar ? "medium" : "large"}
      shortcutLabels={shortcutLabels}
      onPress={message.backspace}
      onLongPress={message.clear}
    />
  );

  const playButton = (
    <PlayButton
      disabled={!playback.isMessagePlaying && !hasMessage}
      isPlaying={playback.isMessagePlaying}
      variant={isPlayInMessageBar ? "prominent" : "boardControl"}
      shortcutLabels={shortcutLabels}
      onPlay={() => void playback.playMessage(message.parts)}
      onStop={playback.stop}
    />
  );

  const renderTile = (button: BoardButton, gridItemProps: GridItemProps) => (
    <Tile
      button={button}
      language={language}
      onActivate={activateButton}
      {...gridItemProps}
    />
  );

  return (
    <DirectionalThemeProvider direction={communication.direction}>
      <ScanningScope>
        <Stack
          {...shortcuts.rootProps}
          dir={communication.direction}
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
              {!areControlsBelowGrid && navigationButtons}

              <PlaybackMessageBar
                parts={message.parts}
                isWordOpen={message.isWordOpen}
                endAction={
                  <>
                    {backspaceButton}
                    {isPlayInMessageBar && playButton}
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
                  language={communication.language}
                  onPhraseSelect={(phrase) =>
                    message.replaceWithText(phrase, communication.language)
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
              rowProps={scanGroupProps}
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
                px: PAGE_MARGIN,
                pb: safeAreaGutter(theme.spacing(PAGE_MARGIN.xs), "bottom"),
              })}
            >
              {navigationButtons}
              {playButton}
            </Stack>
          )}
        </Stack>
      </ScanningScope>
    </DirectionalThemeProvider>
  );
}
