import { useEffect, useState } from "react";

export const RATE_MIN = 0.1;
export const RATE_MAX = 2;
export const PITCH_MIN = 0.1;
export const PITCH_MAX = 2;
export const VOLUME_MIN = 0;
export const VOLUME_MAX = 1;

export interface UseSpeechSynthesisReturn {
  langs: string[];
  voicesByLang: Partial<Record<string, SpeechSynthesisVoice[]>>;
  voicesByLocale: Partial<Record<string, SpeechSynthesisVoice[]>>;
  voices: SpeechSynthesisVoice[];
  voiceURI: string;
  setVoiceURI: (voiceURI: string) => void;
  pitch: number;
  setPitch: (pitch: number) => void;
  rate: number;
  setRate: (rate: number) => void;
  volume: number;
  setVolume: (volume: number) => void;
  speak: (text: string) => Promise<void>;
  cancel: () => void;
  pause: () => void;
  resume: () => void;
  isSpeechSupported: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
}

const isSpeechSupported = "speechSynthesis" in globalThis;
const synth = globalThis.speechSynthesis;

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() =>
    isSpeechSupported ? synth.getVoices() : [],
  );
  const [voiceURI, setVoiceURI] = useState("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const langs = Array.from(new Set(voices.map((voice) => voice.lang))).sort(
    (a, b) => a.localeCompare(b),
  );

  const voicesByLang = Object.groupBy(
    voices,
    (voice) => voice.lang.split("-")[0],
  );

  const voicesByLocale = Object.groupBy(voices, (voice) => voice.lang);

  useEffect(() => {
    if (!isSpeechSupported) {
      return;
    }

    const handleVoicesChanged = () => {
      setVoices(synth.getVoices());
    };

    synth.addEventListener("voiceschanged", handleVoicesChanged);

    return () => {
      synth.removeEventListener("voiceschanged", handleVoicesChanged);
    };
  }, []);

  const speak = async (text: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!isSpeechSupported) {
        reject(new Error("Speech Synthesis is not supported in this browser."));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      const selectedVoice = voices.find((voice) => voice.voiceURI === voiceURI);

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

  return {
    isSpeechSupported,
    voices,
    langs,
    voicesByLang,
    voicesByLocale,
    voiceURI,
    setVoiceURI,
    rate,
    setRate,
    pitch,
    setPitch,
    volume,
    setVolume,
    isSpeaking,
    isPaused,
    speak,
    cancel,
    pause,
    resume,
  };
}
