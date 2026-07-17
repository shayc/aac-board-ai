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
import { useScanGroup, useScanTarget } from "@shayc/switch-scanning/react";
import { createButtonActivation } from "./activation/button-activation";
import {
  ScannableGridRow,
  ScannableSuggestion,
  ScannableTile,
} from "./board-scanning";
import {
  ACTIONS_SCAN_ID,
  BACK_SCAN_ID,
  BACKSPACE_SCAN_ID,
  getSuggestionScanId,
  HOME_SCAN_ID,
  PLAY_SCAN_ID,
  SUGGESTIONS_ENABLE_SCAN_ID,
} from "./board-scanning-ids";
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

  const { activateButton } = createButtonActivation({
    message,
    playback,
    navigation,
  });

  const keyboard = useBoardKeyboard({ message, playback });
  const hasMessage = message.parts.length > 0;

  const playTarget = useScanTarget({
    id: PLAY_SCAN_ID,
    label: playback.isPlaying ? m.messageStop() : m.messagePlay(),
    disabled: !hasMessage,
  });
  const backTarget = useScanTarget({
    id: BACK_SCAN_ID,
    parentId: ACTIONS_SCAN_ID,
    label: m.navBack(),
    disabled: !navigation.canGoBack,
  });
  const homeTarget = useScanTarget({
    id: HOME_SCAN_ID,
    parentId: ACTIONS_SCAN_ID,
    label: m.navHome(),
    disabled: !navigation.canGoHome || navigation.isHome,
  });
  const suggestionsEnableTarget = useScanTarget({
    id: SUGGESTIONS_ENABLE_SCAN_ID,
    parentId: ACTIONS_SCAN_ID,
    label: m.suggestionsEnable(),
    disabled: suggestions.status?.kind !== "needs-activation",
  });
  const backspaceTarget = useScanTarget({
    id: BACKSPACE_SCAN_ID,
    parentId: ACTIONS_SCAN_ID,
    label: m.messageBackspace(),
    disabled: !hasMessage,
  });

  const suggestionScanIds = suggestions.isSupported
    ? suggestions.phrases.map((phrase) => getSuggestionScanId(board.id, phrase))
    : [];
  const actionSequence = [
    ...(navigation.setId ? [BACK_SCAN_ID, HOME_SCAN_ID] : []),
    ...(suggestions.status?.kind === "needs-activation"
      ? [SUGGESTIONS_ENABLE_SCAN_ID]
      : []),
    ...suggestionScanIds,
    BACKSPACE_SCAN_ID,
  ];
  const actionsGroup = useScanGroup({
    id: ACTIONS_SCAN_ID,
    label: m.switchScanningActions(),
    exitLabel: m.switchScanningActionsExit(),
    sequence: actionSequence,
  });
  const isActionsGroupOnTop = !isSmallScreen || suggestions.isSupported;

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
    <ScannableSuggestion
      boardId={board.id}
      phrase={phrase}
      scanParentId={ACTIONS_SCAN_ID}
      onClick={onClick}
    />
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
        slotProps={{ playButton: playTarget }}
        onPlayClick={() => void playback.play(message.parts)}
        onStopClick={playback.stop}
      />

      <Stack
        {...(isActionsGroupOnTop ? actionsGroup : {})}
        direction="row"
        spacing={2}
        sx={{ justifyContent: "flex-end", px: { xs: 2, sm: 3 } }}
      >
        {!isSmallScreen && (
          <NavButtons
            slotProps={{ backButton: backTarget, homeButton: homeTarget }}
          />
        )}

        {suggestions.isSupported && (
          <SuggestionBar
            status={suggestions.status}
            phrases={suggestions.phrases}
            slotProps={{ enableButton: suggestionsEnableTarget }}
            renderPhrase={renderSuggestion}
            onEnable={suggestions.enable}
            onPhraseClick={message.setFromText}
          />
        )}

        {!isSmallScreen && (
          <BackspaceButton
            {...backspaceTarget}
            disabled={!hasMessage}
            onPress={message.removeLastPart}
            onLongPress={message.clear}
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
          renderRow={renderRow}
          dir={direction}
        />
      </Box>

      {isSmallScreen && (
        <Toolbar
          {...(!isActionsGroupOnTop ? actionsGroup : {})}
          sx={{
            justifyContent: "space-between",
            gap: 2,
            px: { xs: 3 },
            pb: safeAreaInset("bottom"),
          }}
        >
          <NavButtons
            slotProps={{ backButton: backTarget, homeButton: homeTarget }}
          />

          <BackspaceButton
            {...backspaceTarget}
            disabled={!hasMessage}
            onPress={message.removeLastPart}
            onLongPress={message.clear}
          />
        </Toolbar>
      )}
    </Stack>
  );
}
