import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import type { SuggestionStatusView } from "./derive-suggestion-status";
import { PendingDot } from "./pending-dot";

export interface SuggestionStatusProps {
  status: SuggestionStatusView;
  onEnable: () => void;
}

export function SuggestionStatus({ status, onEnable }: SuggestionStatusProps) {
  return (
    statusMessage(status, onEnable) ?? (
      <PendingDot show={status?.kind === "pending"} />
    )
  );
}

function statusMessage(status: SuggestionStatusView, onEnable: () => void) {
  if (status === null || status.kind === "pending") {
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
