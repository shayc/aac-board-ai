import { Pictogram } from "@features/board/components/Pictogram/Pictogram";
import { useBoard } from "@features/board/context/useBoard";
import type { MessagePart } from "@features/board/hooks/useMessage";
import ClearIcon from "@mui/icons-material/Clear";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";

export function MessageBar() {
  const { message, clearMessage, playMessage, isPlayingMessage } = useBoard();
  const hasParts = message.length > 0;

  return (
    <Stack direction="row" padding={2} gap={2}>
      <Stack
        direction="row"
        padding={2}
        gap={2}
        flexGrow={2}
        overflow="hidden"
        borderRadius={12}
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === "dark"
              ? theme.palette.grey[800]
              : theme.palette.grey[200],
        }}
      >
        <Stack direction="row" gap={2} flexGrow={1} overflow="auto">
          {message.map((p: MessagePart, index: number) => (
            <Stack key={index} direction="row">
              <Pictogram label={p.label} src={p.imageSrc} />
            </Stack>
          ))}
        </Stack>

        {hasParts && (
          <Tooltip title="Clear message" enterDelay={800}>
            <Box sx={{ alignSelf: "center" }}>
              <IconButton
                aria-label="Clear"
                size="large"
                color="inherit"
                onClick={clearMessage}
              >
                <ClearIcon />
              </IconButton>
            </Box>
          </Tooltip>
        )}
      </Stack>

      <Tooltip title="Speak message" enterDelay={800}>
        <Box sx={{ alignSelf: "center" }}>
          <IconButton
            aria-label="Play"
            size="large"
            onClick={playMessage}
            sx={{
              width: 96,
              height: 96,
              backgroundColor: (theme) => theme.palette.primary.main,
              color: (theme) => theme.palette.primary.contrastText,
              "&:hover": {
                backgroundColor: (theme) => theme.palette.primary.dark,
              },
            }}
          >
            {isPlayingMessage ? (
              <StopIcon sx={{ width: 48, height: 48 }} />
            ) : (
              <PlayArrowIcon sx={{ width: 48, height: 48 }} />
            )}
          </IconButton>
        </Box>
      </Tooltip>
    </Stack>
  );
}
