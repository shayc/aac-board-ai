import {
  setMessagePartHighlightingEnabled,
  useBoardPlaybackConfig,
} from "@features/board";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import ListSubheader from "@mui/material/ListSubheader";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import { m } from "@paraglide/messages.js";
import { useLanguage } from "@shared/language/use-language";
import { useTranslate } from "@shared/language/use-translate";
import { usePlayback } from "@shared/playback/use-playback";
import {
  setPitch,
  setRate,
  setVoiceURI,
  setVolume,
  SPEECH_PITCH,
  SPEECH_RATE,
  SPEECH_VOLUME,
  useSpeechConfig,
  useVoicesByLanguage,
} from "@shared/speech/speech-store";
import { useId } from "react";
import { SettingsSlider } from "./settings-slider";
import { SettingsSwitch } from "./settings-switch";

export function SpeechSettings() {
  const t = useTranslate();
  const selectId = useId();
  const labelId = useId();
  const playback = usePlayback();
  const voicesByLanguage = useVoicesByLanguage();
  const { voiceURI, rate, pitch, volume } = useSpeechConfig();
  const { isMessagePartHighlightingEnabled } = useBoardPlaybackConfig();
  const { language } = useLanguage();

  const voices = voicesByLanguage[language] ?? [];
  const voicesByLocale = Object.groupBy(voices, (voice) => voice.lang);
  const selectedVoiceURI = voices.some((voice) => voice.voiceURI === voiceURI)
    ? voiceURI
    : "";
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
      onChange: setRate,
      formatValue: (value: number) => `${value}x`,
    },
    {
      id: "pitch",
      label: t(m.speechPitch),
      value: pitch,
      min: SPEECH_PITCH.min,
      max: SPEECH_PITCH.max,
      onChange: setPitch,
      formatValue: (value: number) => `${value}x`,
    },
    {
      id: "volume",
      label: t(m.speechVolume),
      value: volume,
      min: SPEECH_VOLUME.min,
      max: SPEECH_VOLUME.max,
      onChange: setVolume,
      formatValue: (value: number) => `${Math.round(value * 100)}%`,
    },
  ];

  return (
    <Stack spacing={3}>
      <FormControl size="small" fullWidth>
        <InputLabel id={labelId}>{t(m.speechVoice)}</InputLabel>
        <Select
          id={selectId}
          labelId={labelId}
          label={t(m.speechVoice)}
          value={selectedVoiceURI}
          onChange={(event) =>
            setVoiceURI(event.target.value === "" ? null : event.target.value)
          }
          variant="outlined"
        >
          {locales.map(renderLocaleOptions)}
        </Select>
      </FormControl>

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

      <SettingsSwitch
        label={t(m.playbackHighlight)}
        checked={isMessagePartHighlightingEnabled}
        onChange={setMessagePartHighlightingEnabled}
      />

      <Button
        variant="contained"
        color="primary"
        startIcon={<PlayArrowIcon />}
        onClick={() =>
          void playback.play({
            source: "speech-preview",
            steps: [{ kind: "speech", text: t(m.speechVoicePreview) }],
          })
        }
        sx={{ alignSelf: "flex-start" }}
      >
        {t(m.speechPreview)}
      </Button>
    </Stack>
  );
}
