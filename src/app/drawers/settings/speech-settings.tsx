import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import ListSubheader from "@mui/material/ListSubheader";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  BuiltInAIError,
  createTranslator,
  useGlobalDownloadProgress,
} from "@shared/built-in-ai";
import { getLanguageCode } from "@shared/locale/locale";
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
  useVoiceCatalog,
} from "@shared/speech/speech-store";

export function SpeechSettings() {
  const { voicesByLocale } = useVoiceCatalog();
  const { voiceURI, rate, pitch, volume } = useSpeechConfig();

  const { language } = useLanguage();
  const translatorProgress = useGlobalDownloadProgress("Translator");
  const isTranslatorDownloading =
    translatorProgress > 0 && translatorProgress < 1;

  const locales = Object.keys(voicesByLocale)
    .filter((voiceLocale) => getLanguageCode(voiceLocale) === language)
    .sort((a, b) => a.localeCompare(b));

  const hasMultipleLocales = locales.length > 1;

  const languageNames = new Intl.DisplayNames([language], {
    type: "language",
  });

  const speechControls = [
    {
      label: "Rate",
      value: rate,
      min: SPEECH_RATE_MIN,
      max: SPEECH_RATE_MAX,
      onChange: setRate,
    },
    {
      label: "Pitch",
      value: pitch,
      min: SPEECH_PITCH_MIN,
      max: SPEECH_PITCH_MAX,
      onChange: setPitch,
    },
    {
      label: "Volume",
      value: volume,
      min: SPEECH_VOLUME_MIN,
      max: SPEECH_VOLUME_MAX,
      onChange: setVolume,
    },
  ];

  async function previewVoice() {
    const defaultGreeting = "Hi, this is my voice!";
    let greeting = defaultGreeting;

    if (language !== "en") {
      try {
        await using translator = await createTranslator({
          sourceLanguage: "en",
          targetLanguage: language,
        });
        greeting = await translator.translate(defaultGreeting);
      } catch (error) {
        // Lifecycle gating — fall through to the untranslated greeting.
        if (!(error instanceof BuiltInAIError)) {
          throw error;
        }
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
            onChange={(_event, newValue) => onChange(newValue)}
          />
        </Stack>
      ))}

      <Button
        variant="contained"
        color="primary"
        disabled={isTranslatorDownloading}
        sx={{ alignSelf: "flex-start" }}
        onClick={() => void previewVoice()}
      >
        Preview
      </Button>
    </Stack>
  );
}
