import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import {
  setAISharedContext,
  useAISharedContext,
} from "@shared/built-in-ai/shared-context-store";
import { isSupported } from "@shayc/react-built-in-ai";

export function SuggestionsSettings() {
  const sharedContext = useAISharedContext();

  if (!isSupported("Rewriter")) {
    return (
      <Typography sx={{ typography: "body2", color: "text.secondary" }}>
        {m.suggestionsUnsupported()}
      </Typography>
    );
  }

  return (
    <TextField
      variant="outlined"
      fullWidth
      multiline
      rows={4}
      label={m.aiCustomInstructions()}
      slotProps={{ inputLabel: { shrink: true } }}
      placeholder={m.aiCustomInstructionsPlaceholder()}
      helperText={m.aiCustomInstructionsHelper()}
      value={sharedContext}
      onChange={(event) => setAISharedContext(event.target.value)}
    />
  );
}
