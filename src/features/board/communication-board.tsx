import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { Theme } from "@mui/material/styles";
import Toolbar from "@mui/material/Toolbar";
import useMediaQuery from "@mui/material/useMediaQuery";
import { m } from "@paraglide/messages.js";
import { useLanguage } from "@shared/language/use-language";
import { useTranslate } from "@shared/language/use-translate";
import { safeAreaInset } from "@shared/theme/safe-area";
import { useRef } from "react";
import { createButtonActivation } from "./activation/button-activation";
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

export function CommunicationBoard({ board }: CommunicationBoardProps) {
  const t = useTranslate();
  const { direction } = useLanguage();
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));
  const { tileSaturation, areTileBordersVisible } = useBoardAppearanceConfig();
  const message = useMessage();
  const playback = useBoardPlayback();
  const suggestions = useMessageSuggestions(message.text);
  const navigation = useBoardNavigation();
  const gridRef = useRef<HTMLDivElement>(null);

  function scrollGridToOrigin() {
    gridRef.current?.scrollTo({ left: 0, top: 0 });
  }

  const { activateButton } = createButtonActivation({
    message,
    playback,
    navigation,
  });

  const keyboard = useBoardKeyboard({ message, playback });
  const hasMessage = message.parts.length > 0;

  const renderTile = (button: BoardButton, props: GridItemProps) => (
    <Tile
      key={button.id}
      label={button.label ?? ""}
      imageSrc={button.imageSrc}
      backgroundColor={button.backgroundColor}
      borderColor={button.borderColor}
      variant={button.loadBoard?.id ? "folder" : undefined}
      borderHidden={!areTileBordersVisible}
      onClick={() => activateButton(button)}
      {...props}
    />
  );

  return (
    <Stack
      {...keyboard.rootProps}
      direction="column"
      sx={[boardRootSx, { "--tile-saturation": String(tileSaturation) }]}
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
              onHomeClick={navigation.isHome ? scrollGridToOrigin : undefined}
            />
          )}

          {suggestions.isSupported && (
            <SuggestionBar
              status={suggestions.status}
              phrases={suggestions.phrases}
              onEnable={suggestions.enable}
              onPhraseClick={message.setFromText}
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
          renderItem={renderTile}
          dir={direction}
        />
      </Box>

      {isSmallScreen && (
        <Toolbar
          sx={{
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 2,
            px: { xs: 3 },
            pb: safeAreaInset("bottom"),
          }}
        >
          <NavButtons
            onHomeClick={navigation.isHome ? scrollGridToOrigin : undefined}
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
