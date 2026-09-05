import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { Theme } from "@mui/material/styles";
import Toolbar from "@mui/material/Toolbar";
import useMediaQuery from "@mui/material/useMediaQuery";
import { m } from "@paraglide/messages.js";
import { useLanguage } from "@shared/language/use-language";
import { useTranslate } from "@shared/language/use-translate";
import { useIsPlaybackActive } from "@shared/playback/use-playback";
import { safeAreaInset } from "@shared/theme/safe-area";
import { useRef, type CSSProperties } from "react";
import { createButtonActivator } from "./activation/button-activation";
import { useBoardAppearanceConfig } from "./appearance/appearance-store";
import { Grid, type GridItemProps } from "./grid/grid";
import { useBoardKeyboard } from "./keyboard/use-board-keyboard";
import { BackspaceButton } from "./message/backspace-button";
import { NavButtons } from "./navigation/nav-buttons";
import { useBoardNavigation } from "./navigation/use-board-navigation";
import { MESSAGE_ORIGIN } from "./playback/board-playback";
import { BoardPlaybackMessageBar } from "./playback/board-playback-message-bar";
import { useCommunicationSession } from "./session/use-communication-session";
import { SuggestionBar } from "./suggestions/suggestion-bar";
import { useMessageSuggestions } from "./suggestions/use-message-suggestions";
import { Tile } from "./tile/tile";
import { useBoardPresentation } from "./translation/use-board-presentation";
import type { Board, BoardButton } from "./types";

interface CommunicationBoardProps {
  board: Board;
  setId?: string;
}

type BoardRootStyle = CSSProperties & {
  "--tile-saturation": string;
};

const boardRootSx = (theme: Theme) => ({
  height: "100%",
  ...theme.applyStyles("dark", {
    backgroundImage:
      "radial-gradient(80% 50% at 50% -20%, rgb(0, 41, 82), transparent)",
    backgroundRepeat: "no-repeat",
  }),
  [theme.breakpoints.up("sm")]: {
    pl: safeAreaInset("left"),
    pr: safeAreaInset("right"),
  },
});

export function CommunicationBoard({
  board: sourceBoard,
  setId,
}: CommunicationBoardProps) {
  const t = useTranslate();
  const { direction } = useLanguage();
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));
  const { tileSaturation, areTileBordersVisible, tileLabelPlacement } =
    useBoardAppearanceConfig();
  const { session, message } = useCommunicationSession();
  const isMessagePlaying = useIsPlaybackActive(MESSAGE_ORIGIN);
  const { board, lockPresentation } = useBoardPresentation(sourceBoard, setId);
  const suggestions = useMessageSuggestions(
    message.displayText,
    message.revision,
  );
  const navigation = useBoardNavigation();
  const gridRef = useRef<HTMLDivElement>(null);

  function scrollGridToOrigin() {
    gridRef.current?.scrollTo({ left: 0, top: 0 });
  }

  function handleHome() {
    if (navigation.isHome) {
      scrollGridToOrigin();
    }

    navigation.goHome();
  }

  const activateButton = createButtonActivator({
    session,
    navigation,
  });

  const keyboard = useBoardKeyboard({ session, isMessagePlaying });
  const hasMessage = message.parts.length > 0;
  const boardRootStyle: BoardRootStyle = {
    "--tile-saturation": String(tileSaturation),
  };

  const renderTile = (button: BoardButton, props: GridItemProps) => {
    const ariaLabel = button.label?.trim()
      ? undefined
      : button.vocalization?.trim() || undefined;

    return (
      <Tile
        key={button.id}
        ariaLabel={ariaLabel}
        label={button.label ?? ""}
        image={button.image}
        backgroundColor={button.backgroundColor}
        borderColor={button.borderColor}
        labelPlacement={tileLabelPlacement}
        variant={button.behavior.kind === "navigate" ? "folder" : undefined}
        borderHidden={!areTileBordersVisible}
        onActivate={() => activateButton(button)}
        {...props}
      />
    );
  };

  return (
    <Stack
      {...keyboard.rootProps}
      direction="column"
      style={boardRootStyle}
      onFocusCapture={lockPresentation}
      onPointerDownCapture={lockPresentation}
      onKeyDownCapture={lockPresentation}
      sx={boardRootSx}
    >
      <title>{board.name}</title>
      <BoardPlaybackMessageBar
        parts={message.parts}
        onPlay={() => void session.playMessage()}
        onStop={session.stop}
      />

      <Stack
        direction="row"
        spacing={2}
        sx={{ justifyContent: "space-between", px: { xs: 2, sm: 3 } }}
      >
        <Stack direction="row" spacing={2} sx={{ flex: 1, minWidth: 0 }}>
          {!isSmallScreen && navigation.setId && (
            <NavButtons
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
              onPhraseSelect={(text) =>
                session.acceptSuggestion({
                  text,
                  revision: suggestions.revision,
                })
              }
            />
          )}
        </Stack>

        {!isSmallScreen && (
          <BackspaceButton
            disabled={!hasMessage}
            onPress={session.backspace}
            onLongPress={session.clear}
          />
        )}
      </Stack>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <Grid<BoardButton>
          ref={gridRef}
          ariaLabel={board.name ?? t(m.boardGridLabel)}
          dir={direction}
          items={board.buttons}
          rows={board.grid.rows}
          columns={board.grid.columns}
          order={board.grid.order}
          renderItem={renderTile}
        />
      </Box>

      {isSmallScreen && navigation.setId && (
        <Toolbar
          sx={{
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 2,
            px: { xs: 3 },
            pb: safeAreaInset("bottom"),
          }}
        >
          <NavButtons
            canGoBack={navigation.canGoBack}
            canGoHome={navigation.canGoHome}
            onBack={navigation.goBack}
            onHome={handleHome}
          />

          <BackspaceButton
            disabled={!hasMessage}
            onPress={session.backspace}
            onLongPress={session.clear}
          />
        </Toolbar>
      )}
    </Stack>
  );
}
