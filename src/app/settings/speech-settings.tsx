import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import ListSubheader from "@mui/material/ListSubheader";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useLanguage } from "@shared/language/use-language";
import {
  setPitch,
  setRate,
  setVolume,
  setVoiceURI,
  speak,
  SPEECH_PITCH_MAX,
  SPEECH_PITCH_MIN,
  SPEECH_RATE_MAX,
  SPEECH_RATE_MIN,
  SPEECH_VOLUME_MAX,
  SPEECH_VOLUME_MIN,
  useSpeechConfig,
  useVoicesByLanguage,
} from "@shared/speech/speech-store";

export function SpeechSettings() {
  const voicesByLanguage = useVoicesByLanguage();
  const { voiceURI, rate, pitch, volume } = useSpeechConfig();

  const { m, language } = useLanguage();

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

  const speechControls = [
    {
      id: "rate",
      label: m.speechRate(),
      value: rate,
      min: SPEECH_RATE_MIN,
      max: SPEECH_RATE_MAX,
      onChange: setRate,
    },
    {
      id: "pitch",
      label: m.speechPitch(),
      value: pitch,
      min: SPEECH_PITCH_MIN,
      max: SPEECH_PITCH_MAX,
      onChange: setPitch,
    },
    {
      id: "volume",
      label: m.speechVolume(),
      value: volume,
      min: SPEECH_VOLUME_MIN,
      max: SPEECH_VOLUME_MAX,
      onChange: setVolume,
    },
  ];

  return (
    <Stack spacing={3}>
      <FormControl size="small" fullWidth>
        <InputLabel id="voice-select-label">{m.voiceLabel()}</InputLabel>
        <Select
          variant="outlined"
          label={m.voiceLabel()}
          labelId="voice-select-label"
          id="voice-select"
          value={voiceURI ?? ""}
          onChange={(event) => setVoiceURI(event.target.value || null)}
        >
          {locales.map((voiceLocale) => [
            hasMultipleLocales && (
              <ListSubheader key={`header-${voiceLocale}`}>
                {languageNames.of(voiceLocale) ?? voiceLocale}
              </ListSubheader>
            ),
            ...(voicesByLocale[voiceLocale] ?? []).map((voice) => (
              <MenuItem key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name}
              </MenuItem>
            )),
          ])}
        </Select>
      </FormControl>

      {speechControls.map(({ id, label, value, min, max, onChange }) => (
        <Stack key={id} spacing={0.5}>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Slider
            aria-label={label}
            valueLabelDisplay="auto"
            value={value}
            min={min}
            max={max}
            step={0.1}
            onChange={(_event, newValue) => onChange(newValue)}
          />
        </Stack>
      ))}

      <Button
        variant="contained"
        color="primary"
        sx={{ alignSelf: "flex-start" }}
        onClick={() => void speak(m.speechVoicePreview())}
      >
        {m.speechPreview()}
      </Button>
    </Stack>
  );
}
