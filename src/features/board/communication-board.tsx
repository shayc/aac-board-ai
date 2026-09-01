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
import { createButtonActivator } from "./activation/button-activation";
import { useBoardAppearanceConfig } from "./appearance/appearance-store";
import { Grid, type GridItemProps } from "./grid/grid";
import { useBoardKeyboard } from "./keyboard/use-board-keyboard";
import { BackspaceButton } from "./message/backspace-button";
import { useMessage } from "./message/use-message";
import { NavButtons } from "./navigation/nav-buttons";
import { useBoardNavigation } from "./navigation/use-board-navigation";
import { BoardPlaybackMessageBar } from "./playback/board-playback-message-bar";
import { useBoardPlayback } from "./playback/use-board-playback";
import { SuggestionBar } from "./suggestions/suggestion-bar";
import { useMessageSuggestions } from "./suggestions/use-message-suggestions";
import { Tile } from "./tile/tile";
import type { Board, BoardButton } from "./types";

interface CommunicationBoardProps {
  board: Board;
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

export function CommunicationBoard({ board }: CommunicationBoardProps) {
  const t = useTranslate();
  const { direction } = useLanguage();
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));
  const { tileSaturation, areTileBordersVisible, tileLabelPlacement } =
    useBoardAppearanceConfig();
  const message = useMessage();
  const playback = useBoardPlayback();
  const suggestions = useMessageSuggestions(message.text);
  const navigation = useBoardNavigation();
  const gridRef = useRef<HTMLDivElement>(null);

  function scrollGridToOrigin() {
    gridRef.current?.scrollTo({ left: 0, top: 0 });
  }

  const activateButton = createButtonActivator({
    message,
    playback,
    navigation,
  });

  const keyboard = useBoardKeyboard({ message, playback });
  const hasMessage = message.parts.length > 0;
  const boardRootStyle: BoardRootStyle = {
    "--tile-saturation": String(tileSaturation),
  };

  const renderTile = (button: BoardButton, props: GridItemProps) => (
    <Tile
      key={button.id}
      label={button.label ?? ""}
      imageSrc={button.imageSrc}
      backgroundColor={button.backgroundColor}
      borderColor={button.borderColor}
      labelPlacement={tileLabelPlacement}
      variant={button.loadBoard?.id ? "folder" : undefined}
      borderHidden={!areTileBordersVisible}
      onActivate={() => activateButton(button)}
      {...props}
    />
  );

  return (
    <Stack
      {...keyboard.rootProps}
      direction="column"
      sx={boardRootSx}
      style={boardRootStyle}
    >
      <BoardPlaybackMessageBar parts={message.parts} />

      <Stack
        direction="row"
        spacing={2}
        sx={{ justifyContent: "space-between", px: { xs: 2, sm: 3 } }}
      >
        <Stack direction="row" spacing={2} sx={{ flex: 1, minWidth: 0 }}>
          {!isSmallScreen && (
            <NavButtons
              onHome={navigation.isHome ? scrollGridToOrigin : undefined}
            />
          )}

          {suggestions.isSupported && (
            <SuggestionBar
              status={suggestions.status}
              phrases={suggestions.phrases}
              onEnable={suggestions.enable}
              onPhraseSelect={message.setFromText}
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
          ref={gridRef}
          ariaLabel={board.name ?? t(m.boardGridLabel)}
          items={board.buttons}
          rows={board.grid.rows}
          columns={board.grid.columns}
          order={board.grid.order}
          dir={direction}
          renderItem={renderTile}
        />
      </Box>

      {isSmallScreen && (
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
            onHome={navigation.isHome ? scrollGridToOrigin : undefined}
          />

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
