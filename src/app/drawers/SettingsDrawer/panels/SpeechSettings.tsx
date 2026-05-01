import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import ListSubheader from "@mui/material/ListSubheader";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslator } from "@shared/ai/useTranslator";
import { useLanguage } from "@shared/language/useLanguage";
import { useSpeech } from "@shared/speech/useSpeech";
import {
  PITCH_MAX,
  PITCH_MIN,
  RATE_MAX,
  RATE_MIN,
  VOLUME_MAX,
  VOLUME_MIN,
} from "@shared/speech/useSpeechSynthesis";

export function SpeechSettings() {
  const {
    voicesByLocale,
    voiceURI,
    setVoiceURI,
    rate,
    setRate,
    pitch,
    setPitch,
    volume,
    setVolume,
    isSpeechSupported,
    speak,
  } = useSpeech();

  const { locale } = useLanguage();
  const { createTranslator } = useTranslator();

  const locales = Object.keys(voicesByLocale)
    .filter((voiceLocale) => voiceLocale.startsWith(locale))
    .sort((a, b) => a.localeCompare(b));

  const localeDisplayNames = new Intl.DisplayNames([locale], {
    type: "language",
  });

  const speechControls = [
    {
      label: "Rate",
      value: rate,
      min: RATE_MIN,
      max: RATE_MAX,
      onChange: setRate,
    },
    {
      label: "Pitch",
      value: pitch,
      min: PITCH_MIN,
      max: PITCH_MAX,
      onChange: setPitch,
    },
    {
      label: "Volume",
      value: volume,
      min: VOLUME_MIN,
      max: VOLUME_MAX,
      onChange: setVolume,
    },
  ];

  async function previewVoice() {
    const translator = await createTranslator({
      sourceLanguage: "en",
      targetLanguage: locale,
    });

    const text = "Hi, this is my voice!";
    const previewText = (await translator?.translate(text)) ?? text;

    void speak(previewText);
  }

  return (
    <Stack spacing={3}>
      <FormControl size="small" fullWidth>
        <InputLabel id="voice-select-label">Voice</InputLabel>
        <Select
          variant="outlined"
          label="Voice"
          labelId="voice-select-label"
          id="voice-select"
          value={voiceURI}
          disabled={!isSpeechSupported}
          onChange={(event) => setVoiceURI(event.target.value)}
        >
          {locales.map((voiceLocale) => [
            locales.length > 1 && (
              <ListSubheader key={`header-${voiceLocale}`}>
                {localeDisplayNames.of(voiceLocale) ?? voiceLocale}
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

      {speechControls.map(({ label, value, min, max, onChange }) => (
        <Stack key={label} spacing={0.5}>
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
            disabled={!isSpeechSupported}
            onChange={(_event, newValue) => onChange(newValue)}
          />
        </Stack>
      ))}

      <Button
        variant="contained"
        color="primary"
        disabled={!isSpeechSupported}
        sx={{ alignSelf: "flex-start" }}
        onClick={() => void previewVoice()}
      >
        Preview
      </Button>
    </Stack>
  );
}
