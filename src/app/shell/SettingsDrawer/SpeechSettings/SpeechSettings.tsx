import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import { useSpeech } from "@shared/contexts/SpeechProvider/SpeechProvider";

export function SpeechSettings() {
  const {
    voices,
    voiceURI,
    setVoiceURI,
    pitch,
    setPitch,
    rate,
    setRate,
    volume,
    setVolume,
    isSupported,
    speak,
  } = useSpeech();

  return (
    <Box>
      <Typography gutterBottom>Voice</Typography>
      <FormControl size="small" fullWidth>
        <InputLabel id="voice-select-label">Voice</InputLabel>
        <Select
          label="Voice"
          labelId="voice-select-label"
          id="voice-select"
          value={voiceURI}
          disabled={!isSupported}
          onChange={(event) => setVoiceURI(event.target.value)}
        >
          {voices.map((voice) => (
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
        disabled={!isSupported}
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
        disabled={!isSupported}
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
        disabled={!isSupported}
        onChange={(_event, value) => setVolume(value)}
      />

      <Button
        variant="contained"
        color="primary"
        disabled={!isSupported}
        onClick={() => speak("Hi, this is my voice!")}
      >
        Preview
      </Button>
    </Box>
  );
}
