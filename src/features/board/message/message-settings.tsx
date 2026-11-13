import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { SettingsSwitch } from "@shared/ui/settings-switch";
import {
  setMessageHighlightingEnabled,
  setMessageImagesVisible,
  setStartsNewMessageAfterSpeaking,
  useMessagePreferences,
} from "./message-preferences-store";

export function MessageSettings() {
  const t = useTranslate();
  const {
    areImagesVisible,
    isHighlightingEnabled,
    startsNewMessageAfterSpeaking,
  } = useMessagePreferences();

  return (
    <>
      <SettingsSwitch
        label={t(m.messageImages)}
        checked={areImagesVisible}
        onChange={setMessageImagesVisible}
      />

      <SettingsSwitch
        label={t(m.messageHighlight)}
        checked={isHighlightingEnabled}
        onChange={setMessageHighlightingEnabled}
      />

      <SettingsSwitch
        label={t(m.messageStartNewAfterSpeaking)}
        checked={startsNewMessageAfterSpeaking}
        onChange={setStartsNewMessageAfterSpeaking}
      />
    </>
  );
}
