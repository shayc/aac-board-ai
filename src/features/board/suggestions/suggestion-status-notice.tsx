import StarShineIcon from "@material-symbols/svg-600/rounded/star_shine-fill.svg?react";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { MaterialIcon } from "@shared/ui/material-icon";
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
          icon={<MaterialIcon svg={StarShineIcon} />}
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
