import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { DotsProgress } from "@shared/components/dots-progress";
import type { ReactElement } from "react";
import type { SuggestionStatusView } from "./use-suggestions";

export interface SuggestionStatusProps {
  status: SuggestionStatusView;
  onEnable: () => void;
}

// The explicit return type makes TS2366 reject a switch that misses a kind.
export function SuggestionStatus({
  status,
  onEnable,
}: SuggestionStatusProps): ReactElement | null {
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
        <Stack
          direction="row"
          sx={{ alignItems: "center", gap: 1, whiteSpace: "nowrap" }}
        >
          <DotsProgress />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {m.suggestionsDownloading({
              progress: Math.round(status.progress * 100),
            })}
          </Typography>
        </Stack>
      );
    case "pending":
      return <DotsProgress />;
    case "unavailable":
      return (
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", whiteSpace: "nowrap" }}
        >
          {m.suggestionsUnavailable()}
        </Typography>
      );
  }
}
