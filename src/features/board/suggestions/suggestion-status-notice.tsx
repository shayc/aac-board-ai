import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Fade from "@mui/material/Fade";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { assertNever } from "@shared/utils/assert-never";
import type { ReactNode } from "react";
import type { SuggestionStatus } from "./derive-suggestion-status";

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
    case "downloading": {
      const progress =
        status.percent !== null &&
        t(m.modelDownloadProgress, { progress: status.percent });

      return (
        <StatusText>
          {t(m.suggestionsDownloading)} {progress}
        </StatusText>
      );
    }
    case "failed":
      return <StatusText>{t(m.suggestionsFailed)}</StatusText>;
    case "unavailable":
      return <StatusText>{t(m.suggestionsUnavailable)}</StatusText>;
    default:
      return assertNever(status);
  }
}

interface PendingDotProps {
  isVisible: boolean;
}

function PendingDot({ isVisible }: PendingDotProps) {
  return (
    <Fade
      in={isVisible}
      style={{ transitionDelay: isVisible ? "300ms" : "0ms" }}
    >
      <Box
        sx={{
          flexShrink: 0,
          width: 8,
          aspectRatio: "1",
          borderRadius: "50%",
          bgcolor: "warning.main",
        }}
      />
    </Fade>
  );
}

interface StatusTextProps {
  children: ReactNode;
}

function StatusText({ children }: StatusTextProps) {
  return (
    <Typography variant="body2" sx={{ color: "text.secondary" }}>
      {children}
    </Typography>
  );
}
