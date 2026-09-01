import CircularProgress from "@mui/material/CircularProgress";
import Fade from "@mui/material/Fade";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message }: LoadingStateProps) {
  const t = useTranslate();
  const resolvedMessage = message ?? t(m.loading);

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
        <CircularProgress />
        {resolvedMessage && (
          <Typography color="text.secondary">{resolvedMessage}</Typography>
        )}
      </Stack>
    </Fade>
  );
}
