import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { ExternalLink } from "@shared/ui/external-link";
import { useId } from "react";
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
  const inputId = useId();

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
    <Stack spacing={1}>
      <Typography component="label" htmlFor={inputId}>
        {t(m.suggestionsCustomInstructions)}
      </Typography>

      <TextField
        id={inputId}
        placeholder={t(m.suggestionsCustomInstructionsPlaceholder)}
        helperText={t(m.suggestionsCustomInstructionsHelper)}
        value={customInstructions}
        onChange={(event) =>
          setSuggestionCustomInstructions(event.target.value)
        }
        variant="outlined"
        fullWidth
        multiline
        rows={4}
      />
    </Stack>
  );
}
