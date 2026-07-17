import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import type { Theme } from "@mui/material/styles";
import Toolbar from "@mui/material/Toolbar";
import useMediaQuery from "@mui/material/useMediaQuery";
import { m } from "@paraglide/messages.js";
import { useHighlightConfig } from "@shared/highlight/highlight-store";
import { useLanguage } from "@shared/language/use-language";
import { SwitchScanningBoundary } from "@shared/switch-scanning/switch-scanning-boundary";
import { safeAreaInset } from "@shared/theme/safe-area";
import { useTileColorConfig } from "@shared/tile-color/tile-color-store";
import { useScanGroup, useScanTarget } from "@shayc/switch-scanning/react";
import { createButtonActivation } from "./activation/button-activation";
import { getNavigationTargetId } from "./button-readers";
import {
  Grid,
  type GridItemProps,
  GridRow,
  type GridRowProps,
} from "./grid/grid";
import { useBoardKeyboard } from "./keyboard/use-board-keyboard";
import { BackspaceButton } from "./message/backspace-button";
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

const ACTIONS_SCAN_ID = "board-actions";
const BACK_SCAN_ID = "board-navigation-back";
const BACKSPACE_SCAN_ID = "board-message-backspace";
const HOME_SCAN_ID = "board-navigation-home";
const SUGGESTIONS_ENABLE_SCAN_ID = "board-suggestions-enable";

const rootSx = (theme: Theme) => ({
  "--scan-outline-width": "5px",
  "--scan-outline-offset": "3px",
  "--scan-within-width": "3px",
  "--scan-within-offset": "1px",
  height: "100%",
  "&& [data-scan-highlighted]": {
    outline:
      "var(--scan-outline-width) solid var(--scan-outline-color, CanvasText)",
    outlineOffset: "var(--scan-outline-offset)",
  },
  "&& [data-scan-within]": {
    outline:
      "var(--scan-within-width) dashed var(--scan-within-color, CanvasText)",
    outlineOffset: "var(--scan-within-offset)",
  },
  "&& [data-scan-exit-highlighted]": {
    outline:
      "var(--scan-outline-width) dashed var(--scan-outline-color, CanvasText)",
    outlineOffset: "var(--scan-outline-offset)",
  },
  "@media (forced-colors: none)": {
    "--scan-outline-color":
      theme.vars?.palette.primary.main ?? theme.palette.primary.main,
    "--scan-within-color":
      theme.vars?.palette.primary.main ?? theme.palette.primary.main,
    "&& [data-scan-highlighted], && [data-scan-exit-highlighted]": {
      boxShadow:
        "0 0 0 calc(var(--scan-outline-width) + var(--scan-outline-offset) + 2px) Canvas",
    },
  },
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
    id: "board-message-play",
    label: playback.isPlaying ? m.messageStop() : m.messagePlay(),
    disabled: !hasMessage,
  });
  const backspaceTarget = useScanTarget({
    id: BACKSPACE_SCAN_ID,
    parentId: ACTIONS_SCAN_ID,
    label: m.messageBackspace(),
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
    <ScannableSuggestion boardId={board.id} phrase={phrase} onClick={onClick} />
  );

  return (
    <Stack
      {...keyboard.rootProps}
      data-switch-scanning-scope=""
      direction="column"
      sx={[rootSx, { "--tile-saturation": String(saturation) }]}
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

interface ScannableTileProps extends GridItemProps {
  boardId: string;
  button: BoardButton;
  borderHidden: boolean;
  onClick: () => void;
}

interface ScannableGridRowProps extends GridRowProps {
  boardId: string;
  buttons: readonly (BoardButton | undefined)[];
  rowIndex: number;
}

interface ScannableSuggestionProps {
  boardId: string;
  phrase: string;
  onClick: () => void;
}

function ScannableSuggestion({
  boardId,
  phrase,
  onClick,
}: ScannableSuggestionProps) {
  const scanTarget = useScanTarget({
    id: getSuggestionScanId(boardId, phrase),
    parentId: ACTIONS_SCAN_ID,
    label: phrase,
  });

  return <Chip {...scanTarget} label={phrase} onClick={onClick} />;
}

function ScannableGridRow({
  boardId,
  buttons,
  rowIndex,
  ...rowProps
}: ScannableGridRowProps) {
  const rowNumber = rowIndex + 1;
  const sequence = buttons.flatMap((button) =>
    button ? [getTileScanId(boardId, button.id)] : [],
  );
  const scanGroup = useScanGroup({
    id: `board-row:${boardId}:${rowIndex}`,
    label: m.switchScanningRow({ row: rowNumber }),
    exitLabel: m.switchScanningRowExit({ row: rowNumber }),
    disabled: sequence.length === 0,
    sequence,
  });

  return <GridRow {...rowProps} {...scanGroup} />;
}

function ScannableTile({
  boardId,
  button,
  borderHidden,
  tabIndex,
  onClick,
}: ScannableTileProps) {
  const label = button.label ?? "";
  const scanTarget = useScanTarget({
    id: getTileScanId(boardId, button.id),
    label,
  });

  return (
    <Tile
      {...scanTarget}
      label={label}
      imageSrc={button.imageSrc}
      backgroundColor={button.backgroundColor}
      borderColor={button.borderColor}
      variant={getNavigationTargetId(button) ? "folder" : undefined}
      borderHidden={borderHidden}
      tabIndex={tabIndex}
      onClick={onClick}
    />
  );
}

function getTileScanId(boardId: string, buttonId: string): string {
  return `board-button:${boardId}:${buttonId}`;
}

function getSuggestionScanId(boardId: string, phrase: string): string {
  return `board-suggestion:${boardId}:${phrase}`;
}
