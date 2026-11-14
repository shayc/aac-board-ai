import type { Board, BoardButton } from "@features/library";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import useMediaQuery from "@mui/material/useMediaQuery";
import { m } from "@paraglide/messages.js";
import { useCommunicationLanguage } from "@shared/language/use-communication-language";
import { useTranslate } from "@shared/language/use-translate";
import { DirectionProvider } from "@shared/theme/direction-provider";
import { safeAreaGutter, safeAreaInset } from "@shared/theme/safe-area";
import { createButtonActivator } from "./activation/button-activator";
import { PAGE_MARGIN, SCROLL_CLEARANCE } from "./board-spacing";
import { Grid, type GridItemProps } from "./grid/grid";
import { BackspaceButton } from "./message/backspace-button";
import { useMessage } from "./message/use-message";
import { NavigationButtons } from "./navigation/navigation-buttons";
import { useBoardNavigation } from "./navigation/use-board-navigation";
import { PlaybackMessageBar } from "./playback/playback-message-bar";
import { useBoardPlayback } from "./playback/use-board-playback";
import { scanGroupProps } from "./scanning/scan-targets";
import { ScanningScope } from "./scanning/scanning-scope";
import { useBoardShortcuts } from "./shortcuts/use-board-shortcuts";
import { SuggestionBar } from "./suggestions/suggestion-bar";
import { useMessageSuggestions } from "./suggestions/use-message-suggestions";
import { Tile } from "./tile/tile";

interface CommunicationBoardProps {
  board: Board;
  contentLanguage: string | undefined;
  rootBoardId: string | undefined;
}

export function CommunicationBoard({
  board,
  contentLanguage,
  rootBoardId,
}: CommunicationBoardProps) {
  const t = useTranslate();
  const { language: communicationLanguage, direction: communicationDirection } =
    useCommunicationLanguage();
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));

  const message = useMessage();
  const suggestions = useMessageSuggestions(message.text);
  const playback = useBoardPlayback({
    onMessagePlayback: message.trackPlayback,
  });
  const navigation = useBoardNavigation(rootBoardId);
  const shortcuts = useBoardShortcuts({ message, playback });

  const activateButton = createButtonActivator({
    message: { getState: message.getState, setState: message.setState },
    playback: {
      playMessage: playback.playMessage,
      echoMessage: playback.echoMessage,
      playPart: playback.playPart,
    },
    navigation: { goToBoard: navigation.goToBoard, goHome: navigation.goHome },
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
      onPress={message.backspace}
      onLongPress={message.clear}
    />
  );

  const renderTile = (button: BoardButton, gridItemProps: GridItemProps) => (
    <Tile
      key={`${board.id}/${button.id}`}
      button={button}
      language={contentLanguage}
      onActivate={activateButton}
      {...gridItemProps}
    />
  );

  const isActionRowVisible = !isSmallScreen || suggestions.isSupported;

  return (
    <DirectionProvider direction={communicationDirection}>
      <ScanningScope>
        <Stack
          {...shortcuts.rootProps}
          dir={communicationDirection}
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
            <PlaybackMessageBar
              parts={message.parts}
              language={contentLanguage}
              isWordOpen={message.isWordOpen}
              playback={playback}
            />

            {isActionRowVisible && (
              <Stack
                {...scanGroupProps}
                direction="row"
                spacing={2}
                sx={{ justifyContent: "space-between" }}
              >
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ flex: 1, minWidth: 0 }}
                >
                  {!isSmallScreen && navigationButtons}

                  {suggestions.isSupported && (
                    <SuggestionBar
                      status={suggestions.status}
                      phrases={suggestions.phrases}
                      language={communicationLanguage}
                      onEnable={suggestions.enable}
                      onPhraseSelect={message.replaceWithText}
                    />
                  )}
                </Stack>

                {!isSmallScreen && backspaceButton}
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
                pb: safeAreaGutter(
                  theme.spacing(SCROLL_CLEARANCE.xs),
                  "bottom",
                ),
              })}
            >
              {navigationButtons}
              {backspaceButton}
            </Stack>
          )}
        </Stack>
      </ScanningScope>
    </DirectionProvider>
  );
}
