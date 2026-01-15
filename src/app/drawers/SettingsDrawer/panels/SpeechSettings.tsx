import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import ListSubheader from "@mui/material/ListSubheader";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import { useLanguage } from "@shared/contexts/LanguageProvider/useLanguage";
import { useSpeech } from "@shared/contexts/SpeechProvider/useSpeech";
import {
  PITCH_MAX,
  PITCH_MIN,
  RATE_MAX,
  RATE_MIN,
  VOLUME_MAX,
  VOLUME_MIN,
} from "@shared/contexts/SpeechProvider/useSpeechSynthesis";
import { useTranslator } from "@shared/hooks/ai/useTranslator";

export function SpeechSettings() {
  const { createTranslator } = useTranslator();

  const {
    voicesByLocale,
    voiceURI,
    setVoiceURI,
    pitch,
    setPitch,
    rate,
    setRate,
    volume,
    setVolume,
    isSpeechSupported,
    speak,
  } = useSpeech();

  const { languageCode } = useLanguage();

  const locales = Object.keys(voicesByLocale)
    .filter((locale) => locale.startsWith(languageCode))
    .sort((a, b) => a.localeCompare(b));

  const localeDisplayNames = new Intl.DisplayNames([languageCode], {
    type: "language",
  });

  async function handlePreviewClick() {
    const translator = await createTranslator({
      sourceLanguage: "en",
      targetLanguage: languageCode,
    });

    const text = "Hi, this is my voice!";
    const previewText = (await translator?.translate(text)) ?? text;

    void speak(previewText);
  }

  return (
    <Box sx={{ mb: 4 }}>
      <FormControl size="small" fullWidth sx={{ mb: 2 }}>
        <InputLabel id="voice-select-label">Voice</InputLabel>
        <Select
          label="Voice"
          labelId="voice-select-label"
          id="voice-select"
          value={voiceURI}
          disabled={!isSpeechSupported}
          onChange={(event) => setVoiceURI(event.target.value)}
        >
          {locales.map((locale) => [
            <ListSubheader key={`header-${locale}`}>
              {localeDisplayNames.of(locale) ?? locale}
            </ListSubheader>,
            ...voicesByLocale[locale].map((voice) => (
              <MenuItem key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name}
              </MenuItem>
            )),
          ])}
        </Select>
      </FormControl>

      <Typography gutterBottom>Rate</Typography>
      <Slider
        aria-label="Rate"
        valueLabelDisplay="auto"
        value={rate}
        min={RATE_MIN}
        max={RATE_MAX}
        step={0.1}
        disabled={!isSpeechSupported}
        onChange={(_event, value) => setRate(value)}
      />

      <Typography gutterBottom>Pitch</Typography>
      <Slider
        aria-label="Pitch"
        valueLabelDisplay="auto"
        value={pitch}
        min={PITCH_MIN}
        max={PITCH_MAX}
        step={0.1}
        disabled={!isSpeechSupported}
        onChange={(_event, value) => setPitch(value)}
      />

      <Typography gutterBottom>Volume</Typography>
      <Slider
        aria-label="Volume"
        valueLabelDisplay="auto"
        value={volume}
        min={VOLUME_MIN}
        max={VOLUME_MAX}
        step={0.1}
        disabled={!isSpeechSupported}
        onChange={(_event, value) => setVolume(value)}
      />

      <Button
        variant="contained"
        color="primary"
        disabled={!isSpeechSupported}
        onClick={() => void handlePreviewClick()}
      >
        Preview
      </Button>
    </Box>
  );
}
