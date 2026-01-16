import { useEffect, useState } from "react";

export const VOLUME_MIN = 0;
export const VOLUME_MAX = 1;
export const RATE_MIN = 0.1;
export const RATE_MAX = 2;
export const PITCH_MIN = 0.1;
export const PITCH_MAX = 2;

const isSpeechSupported = "speechSynthesis" in window;
const synth = window.speechSynthesis;

export function useSpeechSynthesis() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState("");
  const [pitch, setPitch] = useState(1);
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(1);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const langs = Array.from(new Set(voices.map((v) => v.lang))).sort((a, b) =>
    a.localeCompare(b),
  );

  const voicesByLang: Record<string, SpeechSynthesisVoice[]> = {};
  const voicesByLocale: Record<string, SpeechSynthesisVoice[]> = {};

  for (const voice of voices) {
    const lang = voice.lang.split("-")[0];
    (voicesByLang[lang] ??= []).push(voice);
    (voicesByLocale[voice.lang] ??= []).push(voice);
  }

  const speak = async (text: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!isSpeechSupported) {
        reject(new Error("Speech Synthesis is not supported in this browser."));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      const selectedVoice = voices.find((v) => v.voiceURI === voiceURI);

      utterance.voice = selectedVoice ?? null;
      utterance.pitch = pitch;
      utterance.rate = rate;
      utterance.volume = volume;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);

        resolve();
      };

      utterance.onresume = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };

      utterance.onpause = () => {
        setIsSpeaking(false);
        setIsPaused(true);
      };

      utterance.onerror = (event) => {
        setIsSpeaking(false);
        setIsPaused(false);

        reject(new Error(event.error));
      };

      synth.cancel();
      synth.speak(utterance);
    });
  };

  const cancel = () => {
    synth.cancel();
  };

  const pause = () => {
    synth.pause();
  };

  const resume = () => {
    synth.resume();
  };

  useEffect(() => {
    const getVoices = () => {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);
    };

    getVoices();
    synth.addEventListener?.("voiceschanged", getVoices);

    return () => {
      synth.removeEventListener?.("voiceschanged", getVoices);
    };
  }, []);

  return {
    voices,
    voiceURI,
    pitch,
    rate,
    volume,
    setVoiceURI,
    setPitch,
    setRate,
    setVolume,
    speak,
    cancel,
    pause,
    resume,
    isSpeechSupported,
    isSpeaking,
    isPaused,
    langs,
    voicesByLang,
    voicesByLocale,
  };
}
