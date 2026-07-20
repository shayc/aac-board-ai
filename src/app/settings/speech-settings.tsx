import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import ListSubheader from "@mui/material/ListSubheader";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import {
  setHighlightActivePart,
  useHighlightConfig,
} from "@shared/highlight/highlight-store";
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

export function SpeechSettings() {
  const t = useTranslate();
  const playback = usePlayback();
  const voicesByLanguage = useVoicesByLanguage();
  const { voiceURI, rate, pitch, volume } = useSpeechConfig();
  const { highlightActivePart } = useHighlightConfig();

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
        <InputLabel id="voice-select-label">{t(m.speechVoice)}</InputLabel>
        <Select
          variant="outlined"
          label={t(m.speechVoice)}
          labelId="voice-select-label"
          id="voice-select"
          value={selectedVoiceURI}
          onChange={(event) =>
            setVoiceURI(event.target.value === "" ? null : event.target.value)
          }
        >
          {locales.map(renderLocaleOptions)}
        </Select>
      </FormControl>

      {speechControls.map(
        ({ id, label, value, min, max, onChange, formatValue }) => (
          <Stack key={id} spacing={0.5} role="group" aria-label={label}>
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", gap: 2 }}
            >
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {label}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatValue(value)}
              </Typography>
            </Stack>
            <Slider
              aria-label={label}
              getAriaValueText={formatValue}
              value={value}
              min={min}
              max={max}
              step={0.1}
              onChange={(_event, newValue) => onChange(newValue)}
            />
          </Stack>
        ),
      )}

      <FormControlLabel
        labelPlacement="start"
        label={t(m.playbackHighlight)}
        sx={{ justifyContent: "space-between", m: 0 }}
        control={
          <Switch
            checked={highlightActivePart}
            onChange={(event) => setHighlightActivePart(event.target.checked)}
          />
        }
      />

      <Button
        variant="contained"
        color="primary"
        startIcon={<PlayArrowIcon />}
        sx={{ alignSelf: "flex-start" }}
        onClick={() =>
          void playback.play({
            source: "speech-preview",
            steps: [{ kind: "speech", text: t(m.speechVoicePreview) }],
          })
        }
      >
        {t(m.speechPreview)}
      </Button>
    </Stack>
  );
}
