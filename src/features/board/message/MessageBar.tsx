import Stack from "@mui/material/Stack";
import { useEffect, useRef } from "react";
import { Pictogram } from "../grid/Pictogram";
import { BackspaceButton } from "./components/BackspaceButton";
import { PlayButton } from "./components/PlayButton";
import type { MessagePart } from "./useMessage";

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

  return (
    <Stack direction="row" sx={{ p: 2, gap: 2 }}>
      <Stack
        direction="row"
        sx={{
          flexGrow: 2,
          gap: 2,
          borderRadius: 18,
          overflow: "hidden",
          backgroundColor: (theme) =>
            theme.palette.mode === "dark"
              ? theme.palette.grey[800]
              : theme.palette.grey[200],
          border: (theme) =>
            theme.palette.mode === "dark"
              ? `1px solid ${theme.palette.grey[700]}`
              : `1px solid ${theme.palette.grey[400]}`,
        }}
      >
        <Stack
          ref={scrollerRef}
          direction="row"
          sx={{ flexGrow: 1, padding: 2, gap: 1, overflow: "auto" }}
        >
          {message.map((part, index) => (
            <Stack key={index} direction="row">
              <Pictogram label={part.label} src={part.imageSrc} />
            </Stack>
          ))}
        </Stack>

        <Stack direction="row" sx={{ gap: 1 }}>
          <BackspaceButton
            onPress={onBackspacePress}
            onLongPress={onBackspaceLongPress}
          />

          <PlayButton
            isPlaying={isPlaying}
            onPlayClick={onPlayClick}
            onStopClick={onStopClick}
          />
        </Stack>
      </Stack>
    </Stack>
  );
}
