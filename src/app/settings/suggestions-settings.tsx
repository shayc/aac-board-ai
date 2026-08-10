import {
  setSuggestionCustomInstructions,
  useBoardSuggestionConfig,
} from "@features/board";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { isSupported } from "@shayc/react-built-in-ai";

export function SuggestionsSettings() {
  const t = useTranslate();
  const { customInstructions } = useBoardSuggestionConfig();

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
      value={customInstructions}
      onChange={(event) => setSuggestionCustomInstructions(event.target.value)}
    />
  );
}
