import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useBoardNavigation } from "../../hooks/useBoardNavigation";
import { useButtonActivation } from "../../hooks/useButtonActivation";
import { useMessage } from "../../hooks/useMessage";
import { useMessagePlayback } from "../../hooks/useMessagePlayback";
import { useSuggestions } from "../../hooks/useSuggestions";
import type { Board, BoardButton } from "../../types";
import { Grid } from "../Grid/Grid";
import { MessageBar } from "../MessageBar/MessageBar";
import { NavButtons } from "../NavButtons/NavButtons";
import { SuggestionBar } from "../SuggestionBar/SuggestionBar";
import { Tile } from "../Tile/Tile";

export interface BoardViewProps {
  board: Board;
}

export function BoardView({ board }: BoardViewProps) {
  const message = useMessage();
  const playback = useMessagePlayback(message.parts);
  const suggestions = useSuggestions(message.text);
  const navigation = useBoardNavigation();

  const { activateButton } = useButtonActivation({
    message,
    playback,
    navigation,
  });

  return (
    <Stack
      direction="column"
      sx={(theme) => ({
        height: "100%",
        backgroundRepeat: "no-repeat",
        backgroundImage:
          theme.palette.mode === "dark"
            ? "radial-gradient(80% 50% at 50% -20%, rgb(0, 41, 82), transparent)"
            : "radial-gradient(80% 50% at 50% -20%, rgb(204, 230, 255), transparent)",
      })}
    >
      <MessageBar
        message={message.parts}
        isPlaying={playback.isPlaying}
        onBackspacePress={message.removeLastPart}
        onBackspaceLongPress={message.clear}
        onPlayClick={() => void playback.play()}
        onStopClick={playback.stop}
      />

      <Stack
        direction="row"
        spacing={2}
        sx={{ justifyContent: "space-between", px: 2 }}
      >
        <NavButtons
          canGoBack={navigation.canGoBack}
          canGoHome={navigation.canGoHome}
          onBackClick={navigation.goBack}
          onHomeClick={navigation.goHome}
        />

        {suggestions.isAvailable && (
          <SuggestionBar
            suggestions={suggestions.phrases}
            tone={suggestions.tone}
            onToneChange={suggestions.setTone}
            onSuggestionClick={message.setFromText}
          />
        )}
      </Stack>

      <Box sx={{ flexGrow: 1, height: 0, overflow: "auto" }}>
        <Grid<BoardButton>
          rows={board.grid.rows}
          columns={board.grid.columns}
          order={board.grid.order}
          items={board.buttons}
          renderItem={(button, props) => (
            <Tile
              key={button.id}
              label={button.label}
              imageSrc={button.imageSrc}
              backgroundColor={button.backgroundColor}
              borderColor={button.borderColor}
              variant={button.loadBoard ? "folder" : undefined}
              onClick={() => void activateButton(button)}
              {...props}
            />
          )}
        />
      </Box>
    </Stack>
  );
}
