import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { ExternalLink } from "@shared/ui/external-link";
import { isSupported } from "@shayc/react-built-in-ai";
import {
  setSuggestionCustomInstructions,
  useSuggestionPreferences,
} from "./suggestion-preferences-store";

export function SuggestionSettings() {
  const t = useTranslate();
  const { customInstructions } = useSuggestionPreferences();

  if (!isSupported("Rewriter")) {
    return (
      <Alert role="note" severity="info" variant="outlined">
        {t(m.suggestionsUnsupported)}{" "}
        <ExternalLink
          href="https://github.com/shayc/aac-board-ai#enable-suggestions"
          sx={{ whiteSpace: "normal" }}
        >
          {t(m.suggestionsSetupHelp)}
        </ExternalLink>
      </Alert>
    );
  }

  return (
    <TextField
      label={t(m.suggestionsCustomInstructions)}
      placeholder={t(m.suggestionsCustomInstructionsPlaceholder)}
      helperText={t(m.suggestionsCustomInstructionsHelper)}
      value={customInstructions}
      onChange={(event) => setSuggestionCustomInstructions(event.target.value)}
      variant="outlined"
      fullWidth
      multiline
      rows={4}
      slotProps={{ inputLabel: { shrink: true } }}
    />
  );
}
