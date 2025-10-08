import VolumeDownIcon from "@mui/icons-material/VolumeDown";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useSpeech } from "../../../providers";

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
    <div>
      <Typography gutterBottom>Voice</Typography>
      <FormControl size="small" fullWidth>
        <InputLabel id="demo-simple-select-label">Voice</InputLabel>
        <Select
          disabled={!isSupported}
          label="Voice"
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={voiceURI}
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
        disabled={!isSupported}
        aria-label="Pitch"
        valueLabelDisplay="auto"
        value={pitch}
        min={0.1}
        max={2}
        step={0.1}
        onChange={(_event, value) => setPitch(value)}
      />

      <Typography gutterBottom>Rate</Typography>
      <Slider
        disabled={!isSupported}
        aria-label="Rate"
        valueLabelDisplay="auto"
        value={rate}
        min={0.1}
        max={2}
        step={0.1}
        onChange={(_event, value) => setRate(value)}
      />

      <Typography gutterBottom>Volume</Typography>
      <Stack spacing={2} direction="row" sx={{ alignItems: "center", mb: 1 }}>
        <VolumeDownIcon />
        <Slider
          disabled={!isSupported}
          aria-label="Volume"
          valueLabelDisplay="auto"
          value={volume}
          min={0}
          max={1}
          step={0.1}
          onChange={(_event, value) => setVolume(value)}
        />
        <VolumeUpIcon />
      </Stack>

      <Button
        variant="contained"
        color="primary"
        disabled={!isSupported}
        onClick={() => speak("Hi, this is my voice!")}
      >
        Preview
      </Button>
    </div>
  );
}
