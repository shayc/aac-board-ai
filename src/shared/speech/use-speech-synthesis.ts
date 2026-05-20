import { getPrimaryLanguage } from "@shared/language/locale";
import { useEffect, useState } from "react";

export const RATE_MIN = 0.1;
export const RATE_MAX = 2;
export const RATE_DEFAULT = 1;

export const PITCH_MIN = 0.1;
export const PITCH_MAX = 2;
export const PITCH_DEFAULT = 1;

export const VOLUME_MIN = 0;
export const VOLUME_MAX = 1;
export const VOLUME_DEFAULT = 1;

export interface UseSpeechSynthesisReturn {
  locales: string[];
  voicesByLanguage: Partial<Record<string, SpeechSynthesisVoice[]>>;
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
const synthesis = globalThis.speechSynthesis;

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() =>
    isSpeechSupported ? synthesis.getVoices() : [],
  );
  const [voiceURI, setVoiceURI] = useState("");
  const [rate, setRate] = useState(RATE_DEFAULT);
  const [pitch, setPitch] = useState(PITCH_DEFAULT);
  const [volume, setVolume] = useState(VOLUME_DEFAULT);

  const [status, setStatus] = useState<"idle" | "speaking" | "paused">("idle");
  const isSpeaking = status === "speaking";
  const isPaused = status === "paused";

  const locales = Array.from(new Set(voices.map((voice) => voice.lang))).sort(
    (a, b) => a.localeCompare(b),
  );

  const voicesByLanguage = Object.groupBy(voices, (voice) =>
    getPrimaryLanguage(voice.lang),
  );

  const voicesByLocale = Object.groupBy(voices, (voice) => voice.lang);

  useEffect(() => {
    if (!isSpeechSupported) {
      return;
    }

    const handleVoicesChanged = () => {
      setVoices(synthesis.getVoices());
    };

    synthesis.addEventListener("voiceschanged", handleVoicesChanged);

    return () => {
      synthesis.removeEventListener("voiceschanged", handleVoicesChanged);
    };
  }, []);

  function speak(text: string) {
    const { promise, resolve, reject } = Promise.withResolvers<void>();

    if (!isSpeechSupported) {
      reject(new Error("Speech Synthesis is not supported in this browser."));
      return promise;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const selectedVoice = voices.find((voice) => voice.voiceURI === voiceURI);

    utterance.voice = selectedVoice ?? null;
    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.volume = volume;

    utterance.onstart = () => setStatus("speaking");
    utterance.onresume = () => setStatus("speaking");
    utterance.onpause = () => setStatus("paused");

    utterance.onend = () => {
      setStatus("idle");
      resolve();
    };

    utterance.onerror = (event) => {
      setStatus("idle");
      reject(new Error(event.error));
    };

    synthesis.cancel();
    synthesis.speak(utterance);

    return promise;
  }

  function cancel() {
    synthesis.cancel();
  }

  function pause() {
    synthesis.pause();
  }

  function resume() {
    synthesis.resume();
  }

  return {
    isSpeechSupported,
    voices,
    locales,
    voicesByLanguage,
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
