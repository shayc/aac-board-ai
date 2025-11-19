import { Pictogram } from "@features/board/components/Pictogram/Pictogram";
import type { MessagePart } from "@features/board/hooks/useMessage";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import { useEffect, useRef } from "react";
import { BackspaceButton } from "./BackspaceButton";

export interface MessageBarProps {
  message: MessagePart[];
  isPlaying: boolean;
  onBackspacePress: () => void;
  onBackspaceLongPress: () => void;
  onPlayClick: () => void;
  onStopClick: () => void;
}

export function MessageBar({
  message,
  isPlaying,
  onBackspacePress,
  onBackspaceLongPress,
  onPlayClick,
  onStopClick,
}: MessageBarProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const lastChild = scroller?.lastElementChild as HTMLElement | null;

    if (!lastChild) {
      return;
    }

    requestAnimationFrame(() => {
      lastChild.scrollIntoView({
        block: "nearest",
        inline: "end",
        behavior: "instant",
      });
    });
  }, [message]);

  const playButtonLabel = isPlaying ? "Stop playback" : "Play message";

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
          border: (theme) =>
            theme.palette.mode === "dark"
              ? `1px solid ${theme.palette.grey[700]}`
              : `1px solid ${theme.palette.grey[300]}`,
        }}
      >
        <Stack
          ref={scrollerRef}
          direction="row"
          gap={2}
          flexGrow={1}
          overflow="auto"
        >
          {message.map((part) => (
            <Stack key={part.id} direction="row">
              <Pictogram
                label={part.label}
                labelTypographyVariant={part.imageSrc ? "body2" : "h5"}
                src={part.imageSrc}
              />
            </Stack>
          ))}
        </Stack>

        <BackspaceButton
          onPress={onBackspacePress}
          onLongPress={onBackspaceLongPress}
        />
      </Stack>

      <Tooltip title={playButtonLabel} enterDelay={800}>
        <Box sx={{ alignSelf: "center" }}>
          <IconButton
            aria-label={playButtonLabel}
            size="large"
            onClick={isPlaying ? onStopClick : onPlayClick}
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
            {isPlaying ? (
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
