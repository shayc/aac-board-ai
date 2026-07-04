import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { Theme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { m } from "@paraglide/messages.js";
import { useLanguage } from "@shared/language/use-language";
import { usePlaybackConfig } from "@shared/playback/playback-store";
import { safeAreaInset } from "@shared/theme/safe-area";
import { createButtonActivation } from "./activation/button-activation";
import { getNavigationTargetId } from "./board-button";
import { Grid, type GridItemProps } from "./grid/grid";
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

const rootSx = (theme: Theme) => ({
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
  const { direction } = useLanguage();
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));
  const { highlightActivePart } = usePlaybackConfig();
  const message = useMessage();
  const playback = useMessagePlayback();
  const suggestions = useSuggestions(message.text);
  const navigation = useBoardNavigation();

  const { activateButton } = createButtonActivation({
    message,
    playback,
    navigation,
  });

  const keyboard = useBoardKeyboard({ message, playback });

  const renderTile = (button: BoardButton, props: GridItemProps) => (
    <Tile
      key={button.id}
      label={button.label ?? ""}
      imageSrc={button.imageSrc}
      backgroundColor={button.backgroundColor}
      borderColor={button.borderColor}
      variant={getNavigationTargetId(button) ? "folder" : undefined}
      onClick={() => activateButton(button)}
      {...props}
    />
  );

  return (
    <Stack {...keyboard.rootProps} direction="column" sx={rootSx}>
      <MessageBar
        parts={message.parts}
        activePartId={highlightActivePart ? playback.activePartId : null}
        isPlaying={playback.isPlaying}
        onPlayClick={() => void playback.play(message.parts)}
        onStopClick={playback.stop}
      />

      <Stack
        direction="row"
        spacing={2}
        sx={{ justifyContent: "flex-end", px: { xs: 2, sm: 3 } }}
      >
        {suggestions.isSupported && (
          <SuggestionBar
            status={suggestions.status}
            phrases={suggestions.phrases}
            onEnable={suggestions.enable}
            onPhraseClick={message.setFromText}
          />
        )}

        <BackspaceButton
          onPress={message.removeLastPart}
          onLongPress={message.clear}
        />
      </Stack>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <Grid<BoardButton>
          ariaLabel={board.name ?? m.boardGridLabel()}
          items={board.buttons}
          rows={board.grid.rows}
          columns={board.grid.columns}
          order={board.grid.order}
          renderItem={renderTile}
          dir={direction}
        />
      </Box>

      {isSmallScreen && (
        <Box
          sx={{
            minHeight: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pb: safeAreaInset("bottom"),
          }}
        >
          <NavButtons />
        </Box>
      )}
    </Stack>
  );
}
