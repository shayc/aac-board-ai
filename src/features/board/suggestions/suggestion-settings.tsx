import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useLatestAsync } from "@shared/hooks/use-latest-async";
import { useCommunicationLanguage } from "@shared/language/language-store";
import { useTranslate } from "@shared/language/use-translate";
import { ExternalLink } from "@shared/ui/external-link";
import { assertNever } from "@shared/utils/assert-never";
import { type ReactNode, useId } from "react";
import {
  areSuggestionsSupported,
  checkSuggestionLanguageSupport,
} from "./sources/suggestion-support";
import {
  setSuggestionCustomInstructions,
  useSuggestionPreferences,
} from "./suggestion-preferences-store";

export function SuggestionSettings() {
  const t = useTranslate();
  const { language } = useCommunicationLanguage();
  const isSupported = areSuggestionsSupported();
  const languageSupport = useLatestAsync({
    deps: [language],
    run: isSupported
      ? () => checkSuggestionLanguageSupport(language)
      : undefined,
  });

  if (!isSupported) {
    return (
      <UnavailableNotice hasEnableHelp>
        {t(m.suggestionsUnsupported)}
      </UnavailableNotice>
    );
  }

  if (languageSupport.isPending) {
    return null;
  }

  switch (languageSupport.value) {
    case "suggestions-only":
      return (
        <UnavailableNotice hasEnableHelp>
          {t(m.suggestionsCustomInstructionsUnsupported)}
        </UnavailableNotice>
      );
    case "language-unavailable":
      return (
        <UnavailableNotice>
          {t(m.suggestionsLanguageUnavailable)}
        </UnavailableNotice>
      );
    case "device-unavailable":
      return (
        <UnavailableNotice hasEnableHelp>
          {t(m.suggestionsUnsupported)}
        </UnavailableNotice>
      );
    case "custom-instructions":
    case undefined:
      return <CustomInstructionsField />;
    default:
      return assertNever(languageSupport.value);
  }
}

interface UnavailableNoticeProps {
  hasEnableHelp?: boolean;
  children: ReactNode;
}

function UnavailableNotice({
  hasEnableHelp = false,
  children,
}: UnavailableNoticeProps) {
  const t = useTranslate();

  return (
    <Alert role="note" severity="info" variant="outlined">
      {children}

      {hasEnableHelp && (
        <>
          {" "}
          <ExternalLink
            href="https://github.com/shayc/aac-board-ai#enable-ai-suggestions"
            sx={{ whiteSpace: "normal" }}
          >
            {t(m.suggestionsEnableHelp)}
          </ExternalLink>
        </>
      )}
    </Alert>
  );
}

function CustomInstructionsField() {
  const t = useTranslate();
  const { customInstructions } = useSuggestionPreferences();
  const inputId = useId();

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
