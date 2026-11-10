import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { assertNever } from "@shared/utils/assert-never";
import type { SuggestionStatus } from "./derive-suggestion-status";
import { PendingDot } from "./pending-dot";

interface SuggestionStatusNoticeProps {
  status: SuggestionStatus;
  onEnable: () => void;
}

export function SuggestionStatusNotice({
  status,
  onEnable,
}: SuggestionStatusNoticeProps) {
  const t = useTranslate();

  switch (status.kind) {
    case "idle":
    case "pending":
      // Stays mounted while idle so the dot fades instead of popping in.
      return <PendingDot isVisible={status.kind === "pending"} />;
    case "not-enabled":
      return (
        <Chip
          icon={<AutoAwesomeIcon />}
          label={t(m.suggestionsEnable)}
          color="primary"
          variant="outlined"
          onClick={onEnable}
        />
      );
    case "downloading":
      return (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {status.percent === null
            ? t(m.suggestionsDownloadingIndeterminate)
            : t(m.suggestionsDownloading, { progress: status.percent })}
        </Typography>
      );
    case "unavailable":
      return (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {t(m.suggestionsUnavailable)}
        </Typography>
      );
    default:
      return assertNever(status);
  }
}
