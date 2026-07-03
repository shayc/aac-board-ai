import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { m } from "@paraglide/messages.js";
import { rewriterLanguageOptions } from "@shared/built-in-ai/engine-language-options";
import {
  setAISharedContext,
  useAISharedContext,
} from "@shared/built-in-ai/shared-context-store";
import { setAITone, useAITone } from "@shared/built-in-ai/tone-store";
import { useLanguage } from "@shared/language/use-language";
import { isSupported, useRewriter } from "@shayc/react-built-in-ai";
import { deriveToneControlState } from "./derive-tone-control-state";
import { ToneSelector } from "./tone-selector";

export function SuggestionsSettings() {
  const sharedContext = useAISharedContext();
  const tone = useAITone();
  const { language } = useLanguage();
  const rewriter = useRewriter(rewriterLanguageOptions(language));
  const toneControlState = deriveToneControlState(rewriter.status);

  if (!isSupported("Rewriter")) {
    return null;
  }

  return (
    <Stack spacing={1.5}>
      {toneControlState !== "hidden" && (
        <ToneSelector
          tone={tone}
          disabled={toneControlState === "disabled"}
          onChange={setAITone}
        />
      )}

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
    </Stack>
  );
}
