import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import IconButton from "@mui/material/IconButton";
import ListSubheader from "@mui/material/ListSubheader";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import { m } from "@paraglide/messages.js";
import { useUILocale } from "@shared/language/language-store";
import { useLanguage } from "@shared/language/use-language";
import { useTranslate } from "@shared/language/use-translate";
import { usePlayback } from "@shared/playback/use-playback";
import {
  setSpeechPitch,
  setSpeechRate,
  setSpeechVoiceURI,
  setSpeechVolume,
  SPEECH_PITCH,
  SPEECH_RATE,
  SPEECH_VOLUME,
  useSpeechPreferences,
  useVoicesByLanguage,
} from "@shared/speech/speech-store";
import { SettingsSelect } from "@shared/ui/settings-select";
import { SettingsSlider } from "@shared/ui/settings-slider";

export function SpeechSettings() {
  const t = useTranslate();
  const { rate, pitch, volume } = useSpeechPreferences();
  const uiLocale = useUILocale();

  const multiplierFormat = new Intl.NumberFormat(uiLocale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const percentFormat = new Intl.NumberFormat(uiLocale, { style: "percent" });

  return (
    <Stack spacing={3}>
      <VoiceSelect />

      <SettingsSlider
        label={t(m.speechRate)}
        value={rate}
        onChange={setSpeechRate}
        min={SPEECH_RATE.min}
        max={SPEECH_RATE.max}
        step={0.1}
        normalValue={SPEECH_RATE.defaultValue}
        formatValue={(value) => `${multiplierFormat.format(value)}×`}
      />

      <SettingsSlider
        label={t(m.speechPitch)}
        value={pitch}
        onChange={setSpeechPitch}
        min={SPEECH_PITCH.min}
        max={SPEECH_PITCH.max}
        step={0.1}
        normalValue={SPEECH_PITCH.defaultValue}
        formatValue={(value) => percentFormat.format(value)}
      />

      <SettingsSlider
        label={t(m.speechVolume)}
        value={volume}
        onChange={setSpeechVolume}
        min={SPEECH_VOLUME.min}
        max={SPEECH_VOLUME.max}
        step={0.1}
        formatValue={(value) => percentFormat.format(value)}
      />
    </Stack>
  );
}

function VoiceSelect() {
  const t = useTranslate();
  const playback = usePlayback();
  const voicesByLanguage = useVoicesByLanguage();
  const { voiceURI } = useSpeechPreferences();
  const { language } = useLanguage();

  const voices = voicesByLanguage[language] ?? [];
  const voicesByLocale = Object.groupBy(voices, (voice) => voice.lang);
  const selectedVoiceURI =
    voices.find((voice) => voice.voiceURI === voiceURI)?.voiceURI ?? "";
  const locales = Object.keys(voicesByLocale).sort((a, b) =>
    a.localeCompare(b),
  );

  const hasMultipleLocales = locales.length > 1;
  const languageNames = new Intl.DisplayNames([language], {
    type: "language",
  });

  function renderLocaleOptions(voiceLocale: string) {
    const header = hasMultipleLocales && (
      <ListSubheader key={`header-${voiceLocale}`}>
        {languageNames.of(voiceLocale) ?? voiceLocale}
      </ListSubheader>
    );
    const items = (voicesByLocale[voiceLocale] ?? []).map((voice) => (
      <MenuItem key={voice.voiceURI} value={voice.voiceURI}>
        {voice.name}
      </MenuItem>
    ));

    return [header, ...items];
  }

  function handlePreviewVoice() {
    void playback.play({
      owner: "speech-preview",
      steps: [{ kind: "speech", text: t(m.speechPreviewSample) }],
    });
  }

  return (
    <SettingsSelect
      label={t(m.speechVoice)}
      value={selectedVoiceURI}
      onChange={(value) => setSpeechVoiceURI(value === "" ? null : value)}
      action={
        <Tooltip title={t(m.speechPreviewVoice)}>
          <IconButton
            aria-label={t(m.speechPreviewVoice)}
            onClick={handlePreviewVoice}
          >
            <PlayArrowIcon />
          </IconButton>
        </Tooltip>
      }
    >
      {locales.map(renderLocaleOptions)}
    </SettingsSelect>
  );
}
