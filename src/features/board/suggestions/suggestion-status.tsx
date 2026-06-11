import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { DotProgress } from "@shared/components/dot-progress";
import type { SuggestionStatusView } from "./derive-suggestion-status";

export interface SuggestionStatusProps {
  status: SuggestionStatusView;
  onEnable: () => void;
}

export function SuggestionStatus({ status, onEnable }: SuggestionStatusProps) {
  if (status === null) {
    return null;
  }

  switch (status.kind) {
    case "needs-activation":
      return (
        <Chip
          label={m.suggestionsEnable()}
          variant="outlined"
          color="primary"
          onClick={onEnable}
        />
      );
    case "downloading":
      return (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {m.suggestionsDownloading({
            progress: Math.round(status.progress * 100),
          })}
        </Typography>
      );
    case "pending":
      return <DotProgress />;
    case "unavailable":
      return (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {m.suggestionsUnavailable()}
        </Typography>
      );
    default:
      return status satisfies never;
  }
}
