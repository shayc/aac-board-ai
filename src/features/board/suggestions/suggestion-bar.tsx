import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import type { SuggestionStatus } from "./derive-suggestion-status";
import { SuggestionStatusNotice } from "./suggestion-status-notice";

export interface SuggestionBarProps {
  status: SuggestionStatus;
  phrases: readonly string[];
  /** The message so far, which each continuation is shown after. */
  messageText: string;
  /** Each continuation is the nearby words it would add, in order. */
  continuations: readonly (readonly string[])[];
  language: string;
  onEnable: () => void;
  onPhraseSelect: (phrase: string) => void;
  onContinuationSelect: (words: readonly string[]) => void;
}

export function SuggestionBar({
  status,
  phrases,
  messageText,
  continuations,
  language,
  onEnable,
  onPhraseSelect,
  onContinuationSelect,
}: SuggestionBarProps) {
  const t = useTranslate();
  const hasSuggestions = phrases.length + continuations.length > 0;

  return (
    <Stack
      direction="row"
      sx={{
        flex: "1",
        alignItems: "center",
        minHeight: 48,
        gap: 2,
        overflow: "hidden",
      }}
    >
      <SuggestionStatusNotice status={status} onEnable={onEnable} />

      <Box
        // A live region would interrupt the tile's spoken feedback.
        role={hasSuggestions ? "group" : undefined}
        aria-label={hasSuggestions ? t(m.suggestionsLabel) : undefined}
        sx={{
          display: "flex",
          alignItems: "center",
          height: "100%",
          gap: 2,
          marginInlineEnd: "auto",
          overflowX: "auto",
        }}
      >
        {continuations.map((words) => {
          const addedText = words.join(" ");

          return (
            <Chip
              key={`continuation/${addedText}`}
              lang={language}
              label={`${messageText} ${addedText}`}
              variant="outlined"
              onClick={() => onContinuationSelect(words)}
            />
          );
        })}

        {phrases.map((phrase) => (
          <Chip
            key={phrase}
            lang={language}
            label={phrase}
            onClick={() => onPhraseSelect(phrase)}
          />
        ))}
      </Box>
    </Stack>
  );
}
