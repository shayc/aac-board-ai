import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import ListSubheader from "@mui/material/ListSubheader";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { createSession } from "@shared/ai/built-in-ai/spec";
import {
  setDownloadProgress,
  useDownloadProgress,
} from "@shared/ai/downloadProgress";
import {
  getPrimaryLanguage,
  normalizeLocaleCode,
} from "@shared/language/locale";
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

  const { language } = useLanguage();
  const translatorProgress = useDownloadProgress("Translator");
  const isTranslatorDownloading =
    translatorProgress > 0 && translatorProgress < 1;

  const locales = Object.keys(voicesByLocale)
    .filter((voiceLocale) => getPrimaryLanguage(voiceLocale) === language)
    .sort((a, b) => a.localeCompare(b));

  const hasMultipleLocales = locales.length > 1;

  const languageNames = new Intl.DisplayNames([language], {
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
    const defaultGreeting = "Hi, this is my voice!";
    const sourceLanguage = normalizeLocaleCode("en");
    const targetLanguage = normalizeLocaleCode(language);
    let greeting = defaultGreeting;

    if (sourceLanguage !== targetLanguage) {
      const progressKey = `${sourceLanguage}:${targetLanguage}`;
      let translator: Translator | null = null;
      try {
        translator = await createSession("Translator", {
          sourceLanguage,
          targetLanguage,
          onProgress: (p) => setDownloadProgress("Translator", p, progressKey),
        });
        if (translator) {
          greeting = await translator.translate(defaultGreeting);
        }
      } finally {
        translator?.destroy();
        setDownloadProgress("Translator", 1, progressKey);
      }
    }

    void speak(greeting);
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
        disabled={!isSpeechSupported || isTranslatorDownloading}
        sx={{ alignSelf: "flex-start" }}
        onClick={() => void previewVoice()}
      >
        Preview
      </Button>
    </Stack>
  );
}
