import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import Chip, { type ChipProps } from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import type { SuggestionStatusView } from "./derive-suggestion-status";

interface SuggestionStatusProps {
  status: SuggestionStatusView;
  enableButtonProps?: SuggestionEnableButtonProps;
  onEnable: () => void;
}

export type SuggestionEnableButtonProps = Omit<
  ChipProps,
  "color" | "icon" | "label" | "onClick" | "variant"
>;

export function SuggestionStatus({
  status,
  enableButtonProps,
  onEnable,
}: SuggestionStatusProps) {
  if (status === null || status.kind === "pending") {
    return null;
  }

  switch (status.kind) {
    case "needs-activation":
      return (
        <Chip
          {...enableButtonProps}
          icon={<AutoAwesomeIcon />}
          label={m.suggestionsEnable()}
          color="primary"
          variant="outlined"
          onClick={onEnable}
        />
      );
    case "downloading":
      return (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {status.percent === null
            ? m.suggestionsDownloadingIndeterminate()
            : m.suggestionsDownloading({ progress: status.percent })}
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
