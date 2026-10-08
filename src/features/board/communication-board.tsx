import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { Theme } from "@mui/material/styles";
import Toolbar from "@mui/material/Toolbar";
import useMediaQuery from "@mui/material/useMediaQuery";
import { m } from "@paraglide/messages.js";
import { useLanguage } from "@shared/language/use-language";
import { useTranslate } from "@shared/language/use-translate";
import { safeAreaInset } from "@shared/theme/safe-area";
import { useRef, type CSSProperties } from "react";
import { AACSymbol } from "./aac-symbol/aac-symbol";
import { createButtonActivator } from "./activation/button-activation";
import { useBoardAppearanceConfig } from "./appearance/appearance-store";
import type { Board, BoardButton } from "./board-types";
import { Grid, type GridItemProps } from "./grid/grid";
import { useBoardKeyboard } from "./keyboard/use-board-keyboard";
import { BackspaceButton } from "./message/backspace-button";
import { useMessage } from "./message/use-message";
import { NavButtons } from "./navigation/nav-buttons";
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
  const { direction } = useLanguage();

  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));
  const { tileSaturation, areTileBordersVisible, tileLabelPlacement } =
    useBoardAppearanceConfig();

  const message = useMessage();
  const suggestions = useMessageSuggestions(message.text);

  const playback = useBoardPlayback();

  const navigation = useBoardNavigation();
  const gridViewportRef = useRef<HTMLDivElement>(null);

  const activateButton = createButtonActivator({
    message,
    playback,
    navigation,
  });
  const keyboard = useBoardKeyboard({ message, playback });

  const hasMessage = message.parts.length > 0;
  const isInBoardSet = Boolean(navigation.setId);

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

  const renderTile = (button: BoardButton, gridItemProps: GridItemProps) => {
    return (
      <Tile
        key={button.id}
        ariaLabel={button.label ? undefined : button.vocalization}
        backgroundColor={button.backgroundColor}
        borderColor={button.borderColor}
        variant={button.loadBoard ? "folder" : undefined}
        borderHidden={!areTileBordersVisible}
        onActivate={() => activateButton(button)}
        {...gridItemProps}
      >
        <AACSymbol
          label={button.label}
          imageSrc={button.imageSrc}
          labelPlacement={tileLabelPlacement}
        />
      </Tile>
    );
  };

  return (
    <Stack
      {...keyboard.rootProps}
      direction="column"
      style={boardRootStyle}
      sx={createBoardRootSx}
    >
      <PlaybackMessageBar parts={message.parts} playback={playback} />

      <Stack
        direction="row"
        spacing={2}
        sx={{ justifyContent: "space-between", px: { xs: 2, sm: 3 } }}
      >
        <Stack direction="row" spacing={2} sx={{ flex: 1, minWidth: 0 }}>
          {!isSmallScreen && isInBoardSet && (
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
        <Grid<BoardButton>
          ref={gridViewportRef}
          ariaLabel={board.name ?? t(m.boardGridLabel)}
          dir={direction}
          items={board.buttons}
          rows={board.grid.rows}
          columns={board.grid.columns}
          order={board.grid.order}
          renderItem={renderTile}
        />
      </Box>

      {isSmallScreen && (
        <Toolbar
          sx={{
            alignItems: "flex-end",
            justifyContent: isInBoardSet ? "space-between" : "flex-end",
            gap: 2,
            px: { xs: 3 },
            pb: safeAreaInset("bottom"),
          }}
        >
          {isInBoardSet && (
            <NavButtons
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

function createBoardRootSx(theme: Theme) {
  return {
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
  };
}
