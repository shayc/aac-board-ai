import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { ExternalLink } from "@shared/ui/external-link";
import {
  setSuggestionCustomInstructions,
  useSuggestionPreferences,
} from "./suggestion-preferences-store";
import {
  areCustomInstructionsSupported,
  areSuggestionsSupported,
} from "./suggestion-support";

export function SuggestionSettings() {
  const t = useTranslate();
  const { customInstructions } = useSuggestionPreferences();

  if (!areCustomInstructionsSupported()) {
    const unsupportedMessage = areSuggestionsSupported()
      ? m.suggestionsCustomInstructionsUnsupported
      : m.suggestionsUnsupported;

    return (
      <Alert role="note" severity="info" variant="outlined">
        {t(unsupportedMessage)}{" "}
        <ExternalLink
          href="https://github.com/shayc/aac-board-ai#enable-ai-suggestions"
          sx={{ whiteSpace: "normal" }}
        >
          {t(m.suggestionsEnableHelp)}
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
