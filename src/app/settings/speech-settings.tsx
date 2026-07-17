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
import { speak } from "@shared/speech/speak";
import {
  setPitch,
  setRate,
  setVolume,
  setVoiceURI,
  SPEECH_PITCH,
  SPEECH_RATE,
  SPEECH_VOLUME,
  useSpeechConfig,
  useVoicesByLanguage,
} from "@shared/speech/speech-store";

export function SpeechSettings() {
  const voicesByLanguage = useVoicesByLanguage();
  const { voiceURI, rate, pitch, volume } = useSpeechConfig();
  const { highlightActivePart } = useHighlightConfig();

  const { language } = useLanguage();

  const voicesByLocale = Object.groupBy(
    voicesByLanguage[language] ?? [],
    (voice) => voice.lang,
  );
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
      label: m.speechRate(),
      value: rate,
      min: SPEECH_RATE.min,
      max: SPEECH_RATE.max,
      onChange: setRate,
      valueLabelFormat: (value: number) => `${value}x`,
    },
    {
      id: "pitch",
      label: m.speechPitch(),
      value: pitch,
      min: SPEECH_PITCH.min,
      max: SPEECH_PITCH.max,
      onChange: setPitch,
      valueLabelFormat: (value: number) => `${value}x`,
    },
    {
      id: "volume",
      label: m.speechVolume(),
      value: volume,
      min: SPEECH_VOLUME.min,
      max: SPEECH_VOLUME.max,
      onChange: setVolume,
      valueLabelFormat: (value: number) => `${Math.round(value * 100)}%`,
    },
  ];

  return (
    <Stack spacing={3}>
      <FormControl size="small" fullWidth>
        <InputLabel id="voice-select-label">{m.speechVoice()}</InputLabel>
        <Select
          variant="outlined"
          label={m.speechVoice()}
          labelId="voice-select-label"
          id="voice-select"
          value={voiceURI ?? ""}
          onChange={(event) => setVoiceURI(event.target.value || null)}
        >
          {locales.map(renderLocaleOptions)}
        </Select>
      </FormControl>

      {speechControls.map(
        ({ id, label, value, min, max, onChange, valueLabelFormat }) => (
          <Stack key={id} spacing={0.5}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {label}
            </Typography>
            <Slider
              aria-label={label}
              valueLabelDisplay="auto"
              valueLabelFormat={valueLabelFormat}
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
        label={m.playbackHighlight()}
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
        onClick={() => void speak(m.speechVoicePreview())}
      >
        {m.speechPreview()}
      </Button>
    </Stack>
  );
}
