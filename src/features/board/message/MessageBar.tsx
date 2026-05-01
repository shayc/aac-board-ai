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

function scrollToEnd(container: HTMLElement | null): number | null {
  const lastChild = container?.lastElementChild;

  if (!lastChild) {
    return null;
  }

  return requestAnimationFrame(() => {
    lastChild.scrollIntoView({
      block: "nearest",
      inline: "end",
      behavior: "instant",
    });
  });
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
    const frameId = scrollToEnd(scrollerRef.current);

    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [message]);

  return (
    <Stack direction="row" sx={{ p: 2, gap: 2 }}>
      <Stack
        direction="row"
        sx={(theme) => ({
          flexGrow: 2,
          gap: 2,
          borderRadius: 18,
          overflow: "hidden",
          backgroundColor:
            theme.palette.mode === "dark"
              ? theme.palette.grey[800]
              : theme.palette.grey[200],
          border: `1px solid ${
            theme.palette.mode === "dark"
              ? theme.palette.grey[700]
              : theme.palette.grey[400]
          }`,
        })}
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
