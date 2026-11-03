import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import IconButton from "@mui/material/IconButton";
import ListSubheader from "@mui/material/ListSubheader";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import { m } from "@paraglide/messages.js";
import { useLanguage } from "@shared/language/use-language";
import { useTranslate } from "@shared/language/use-translate";
import { usePlayback } from "@shared/playback/use-playback";
import {
  setSpeechPitch,
  setSpeechRate,
  setVoiceURI,
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
  const playback = usePlayback();
  const voicesByLanguage = useVoicesByLanguage();
  const { voiceURI, rate, pitch, volume } = useSpeechPreferences();
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

  const speechControls = [
    {
      id: "rate",
      label: t(m.speechRate),
      value: rate,
      min: SPEECH_RATE.min,
      max: SPEECH_RATE.max,
      onChange: setSpeechRate,
      formatValue: (value: number) => `${value.toFixed(1)}x`,
    },
    {
      id: "pitch",
      label: t(m.speechPitch),
      value: pitch,
      min: SPEECH_PITCH.min,
      max: SPEECH_PITCH.max,
      onChange: setSpeechPitch,
      formatValue: (value: number) => `${value.toFixed(1)}x`,
    },
    {
      id: "volume",
      label: t(m.speechVolume),
      value: volume,
      min: SPEECH_VOLUME.min,
      max: SPEECH_VOLUME.max,
      onChange: setSpeechVolume,
      formatValue: (value: number) => `${Math.round(value * 100)}%`,
    },
  ];

  function handlePreviewSpeech() {
    void playback.play({
      owner: "speech-preview",
      steps: [{ kind: "speech", text: t(m.speechPreviewSample) }],
    });
  }

  return (
    <Stack spacing={3}>
      <SettingsSelect
        label={t(m.speechVoice)}
        value={selectedVoiceURI}
        onChange={(value) => setVoiceURI(value === "" ? null : value)}
        action={
          <Tooltip title={t(m.speechPreviewVoice)}>
            <IconButton
              aria-label={t(m.speechPreviewVoice)}
              size="large"
              onClick={handlePreviewSpeech}
            >
              <PlayArrowIcon />
            </IconButton>
          </Tooltip>
        }
      >
        {locales.map(renderLocaleOptions)}
      </SettingsSelect>

      {speechControls.map(
        ({ id, label, value, min, max, onChange, formatValue }) => (
          <SettingsSlider
            key={id}
            label={label}
            value={value}
            onChange={onChange}
            min={min}
            max={max}
            step={0.1}
            formatValue={formatValue}
          />
        ),
      )}
    </Stack>
  );
}
