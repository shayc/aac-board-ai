import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { DotsProgress } from "@shared/components/dots-progress";

export interface SuggestionStatusProps {
  isPending: boolean;
  downloadProgress: number | null;
  needsActivation: boolean;
  hasFailure: boolean;
  onEnable: () => void;
}

export function SuggestionStatus({
  isPending,
  downloadProgress,
  needsActivation,
  hasFailure,
  onEnable,
}: SuggestionStatusProps) {
  if (needsActivation) {
    return (
      <Chip
        label={m.suggestionsEnable()}
        variant="outlined"
        color="primary"
        onClick={onEnable}
      />
    );
  }

  if (downloadProgress !== null) {
    return (
      <Stack
        direction="row"
        sx={{ alignItems: "center", gap: 1, whiteSpace: "nowrap" }}
      >
        <DotsProgress />
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {m.suggestionsDownloading({
            progress: Math.round(downloadProgress * 100),
          })}
        </Typography>
      </Stack>
    );
  }

  if (isPending) {
    return <DotsProgress />;
  }

  if (hasFailure) {
    return (
      <Typography
        variant="body2"
        sx={{ color: "text.secondary", whiteSpace: "nowrap" }}
      >
        {m.suggestionsUnavailable()}
      </Typography>
    );
  }

  return null;
}
