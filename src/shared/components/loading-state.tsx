import CircularProgress from "@mui/material/CircularProgress";
import Fade from "@mui/material/Fade";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";

export interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = m.loading() }: LoadingStateProps) {
  return (
    <Fade in timeout={400} style={{ transitionDelay: "300ms" }}>
      <Stack
        sx={{
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <CircularProgress />
        {message && <Typography color="text.secondary">{message}</Typography>}
      </Stack>
    </Fade>
  );
}
