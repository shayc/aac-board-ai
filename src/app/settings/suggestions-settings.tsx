import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import {
  setAISharedContext,
  useAISharedContext,
} from "@shared/built-in-ai/shared-context-store";
import { useTranslate } from "@shared/language/use-translate";
import { isSupported } from "@shayc/react-built-in-ai";

export function SuggestionsSettings() {
  const t = useTranslate();
  const sharedContext = useAISharedContext();

  if (!isSupported("Rewriter")) {
    return (
      <Typography sx={{ typography: "body2", color: "text.secondary" }}>
        {t(m.suggestionsUnsupported)}
      </Typography>
    );
  }

  return (
    <TextField
      variant="outlined"
      fullWidth
      multiline
      rows={4}
      label={t(m.aiCustomInstructions)}
      slotProps={{ inputLabel: { shrink: true } }}
      placeholder={t(m.aiCustomInstructionsPlaceholder)}
      helperText={t(m.aiCustomInstructionsHelper)}
      value={sharedContext}
      onChange={(event) => setAISharedContext(event.target.value)}
    />
  );
}
