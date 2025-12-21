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
import { useTranslator } from "@shared/hooks/ai/useTranslator";

export function SpeechSettings() {
  const { createTranslator } = useTranslator();

  const {
    voicesByLang,
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
  const voices = voicesByLang[languageCode] || [];

  const localVoices = voices.filter((voice) => voice.localService);
  const onlineVoices = voices.filter((voice) => !voice.localService);

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
          {localVoices.length > 0 && <ListSubheader>Local</ListSubheader>}
          {localVoices.map((voice) => (
            <MenuItem key={voice.voiceURI} value={voice.voiceURI}>
              {voice.name}
            </MenuItem>
          ))}

          {onlineVoices.length > 0 && <ListSubheader>Online</ListSubheader>}
          {onlineVoices.map((voice) => (
            <MenuItem key={voice.voiceURI} value={voice.voiceURI}>
              {voice.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Typography gutterBottom>Pitch</Typography>
      <Slider
        aria-label="Pitch"
        valueLabelDisplay="auto"
        value={pitch}
        min={0.1}
        max={2}
        step={0.1}
        disabled={!isSpeechSupported}
        onChange={(_event, value) => setPitch(value)}
      />

      <Typography gutterBottom>Rate</Typography>
      <Slider
        aria-label="Rate"
        valueLabelDisplay="auto"
        value={rate}
        min={0.1}
        max={2}
        step={0.1}
        disabled={!isSpeechSupported}
        onChange={(_event, value) => setRate(value)}
      />

      <Typography gutterBottom>Volume</Typography>
      <Slider
        aria-label="Volume"
        valueLabelDisplay="auto"
        value={volume}
        min={0}
        max={1}
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
