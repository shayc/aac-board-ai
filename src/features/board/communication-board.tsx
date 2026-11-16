import type { Board, BoardButton } from "@features/library";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import useMediaQuery from "@mui/material/useMediaQuery";
import { m } from "@paraglide/messages.js";
import { useCommunicationLanguage } from "@shared/language/language-store";
import { useTranslate } from "@shared/language/use-translate";
import { DirectionalThemeProvider } from "@shared/theme/directional-theme-provider";
import { safeAreaGutter, safeAreaInset } from "@shared/theme/safe-area";
import { ErrorBoundary } from "@shared/ui/error-boundary";
import { createButtonActivator } from "./activation/button-activator";
import { PAGE_MARGIN, SCROLL_CLEARANCE } from "./board-spacing";
import { Grid, type GridItemProps } from "./grid/grid";
import { BackspaceButton } from "./message/backspace-button";
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
import { SuggestionBar } from "./suggestions/suggestion-bar";
import { useMessageSuggestions } from "./suggestions/use-message-suggestions";
import { Tile } from "./tile/tile";

interface CommunicationBoardProps {
  board: Board;
  /** The language the board's text is in, when known; it may not be the communication language. */
  language: string | undefined;
  rootBoardId: string | undefined;
}

export function CommunicationBoard({
  board,
  language,
  rootBoardId,
}: CommunicationBoardProps) {
  const t = useTranslate();
  const communication = useCommunicationLanguage();
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));

  const message = useMessage();
  const suggestions = useMessageSuggestions(message.text);
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
    },
    navigation: { goToBoard: navigation.goToBoard, goHome: navigation.goHome },
    language,
  });

  const hasMessage = message.parts.length > 0;

  const navigationButtons = (
    <NavigationButtons
      canGoBack={navigation.canGoBack}
      canGoHome={navigation.canGoHome}
      onBack={navigation.goBack}
      onHome={navigation.goHome}
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
      variant={isSmallScreen ? "boardControl" : "prominent"}
      shortcutLabels={shortcutLabels}
      onPlay={() => void playback.playMessage(message.parts)}
      onStop={playback.stop}
    />
  );

  const renderTile = (button: BoardButton, gridItemProps: GridItemProps) => (
    <Tile
      key={`${board.id}/${button.id}`}
      button={button}
      language={language}
      onActivate={activateButton}
      {...gridItemProps}
    />
  );

  const isActionRowVisible = !isSmallScreen || suggestions.isAvailable;

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
          <Stack
            spacing={PAGE_MARGIN}
            sx={{ pt: PAGE_MARGIN, px: PAGE_MARGIN }}
          >
            <Stack
              {...scanGroupProps}
              direction="row"
              spacing={PAGE_MARGIN}
              sx={{ alignItems: "center" }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <PlaybackMessageBar
                  parts={message.parts}
                  isWordOpen={message.isWordOpen}
                  endAction={backspaceButton}
                />
              </Box>

              {!isSmallScreen && playButton}
            </Stack>

            {isActionRowVisible && (
              <Stack {...scanGroupProps} direction="row" spacing={2}>
                {!isSmallScreen && navigationButtons}

                {suggestions.isAvailable && (
                  // Suggestions are optional: if they break, hide them as if
                  // built-in AI were unavailable and keep the board usable.
                  <ErrorBoundary fallback={null}>
                    <SuggestionBar
                      status={suggestions.status}
                      phrases={suggestions.phrases}
                      language={communication.language}
                      onEnable={suggestions.enable}
                      onPhraseSelect={(phrase) =>
                        message.replaceWithText(phrase, communication.language)
                      }
                    />
                  </ErrorBoundary>
                )}
              </Stack>
            )}
          </Stack>

          <Box sx={{ flex: 1, minHeight: 0, py: SCROLL_CLEARANCE }}>
            <Grid<BoardButton>
              aria-label={board.name || t(m.boardGridLabel)}
              items={board.buttons}
              order={board.grid.order}
              rowProps={scanGroupProps}
              renderItem={renderTile}
            />
          </Box>

          {isSmallScreen && (
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
