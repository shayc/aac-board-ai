import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import SparkleIcon from "@phosphor-icons/core/fill/sparkle-fill.svg?react";
import { useTranslate } from "@shared/language/use-translate";
import { PhosphorIcon } from "@shared/ui/phosphor-icon";
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
      return null;
    case "not-enabled":
      return (
        <Chip
          icon={<PhosphorIcon icon={SparkleIcon} />}
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
    default:
      return assertNever(status);
  }
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
