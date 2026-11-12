import CircularProgress from "@mui/material/CircularProgress";
import Fade from "@mui/material/Fade";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { useId } from "react";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message }: LoadingStateProps) {
  const t = useTranslate();
  const messageId = useId();

  return (
    <Fade in timeout={400} style={{ transitionDelay: "300ms" }}>
      <Stack
        sx={{
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 2,
        }}
      >
        <CircularProgress aria-labelledby={messageId} />
        {/* The indicator carries the message as its name, so it is read once. */}
        <Typography aria-hidden id={messageId} color="text.secondary">
          {message ?? t(m.loading)}
        </Typography>
      </Stack>
    </Fade>
  );
}
