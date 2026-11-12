import { BoardTranslationNotice } from "@features/language-help";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import { m } from "@paraglide/messages.js";
import { useLanguageOptions } from "@shared/language/use-language-options";
import { useLanguage } from "@shared/language/use-language";
import { useTranslate } from "@shared/language/use-translate";
import { SettingsSelect } from "@shared/ui/settings-select";

export function LanguageSettings() {
  const t = useTranslate();
  const { language, setLanguage } = useLanguage();
  const languageOptions = useLanguageOptions();

  return (
    <Stack spacing={2}>
      <SettingsSelect
        label={t(m.languageLabel)}
        value={language}
        onChange={setLanguage}
      >
        {languageOptions.map(({ code, name }) => (
          <MenuItem key={code} value={code}>
            {name}
          </MenuItem>
        ))}
      </SettingsSelect>

      <BoardTranslationNotice />
    </Stack>
  );
}
