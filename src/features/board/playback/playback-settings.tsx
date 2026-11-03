import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { SettingsSwitch } from "@shared/ui/settings-switch";
import {
  setPlaybackHighlightingEnabled,
  usePlaybackPreferences,
} from "./playback-preferences-store";

export function PlaybackSettings() {
  const t = useTranslate();
  const { isHighlightingEnabled } = usePlaybackPreferences();

  return (
    <SettingsSwitch
      label={t(m.playbackHighlight)}
      checked={isHighlightingEnabled}
      onChange={setPlaybackHighlightingEnabled}
    />
  );
}
