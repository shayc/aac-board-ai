import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import ListSubheader from "@mui/material/ListSubheader";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useLanguage } from "@shared/language/use-language";
import {
  setPitch,
  setRate,
  setVolume,
  setVoiceURI,
  speak,
  SPEECH_PITCH,
  SPEECH_RATE,
  SPEECH_VOLUME,
  useSpeechConfig,
  useVoicesByLanguage,
} from "@shared/speech/speech-store";

export function SpeechSettings() {
  const voicesByLanguage = useVoicesByLanguage();
  const { voiceURI, rate, pitch, volume } = useSpeechConfig();

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

  const speechControls = [
    {
      id: "rate",
      label: m.speechRate(),
      value: rate,
      min: SPEECH_RATE.min,
      max: SPEECH_RATE.max,
      onChange: setRate,
    },
    {
      id: "pitch",
      label: m.speechPitch(),
      value: pitch,
      min: SPEECH_PITCH.min,
      max: SPEECH_PITCH.max,
      onChange: setPitch,
    },
    {
      id: "volume",
      label: m.speechVolume(),
      value: volume,
      min: SPEECH_VOLUME.min,
      max: SPEECH_VOLUME.max,
      onChange: setVolume,
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
          <Typography variant="body2">{label}</Typography>
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
