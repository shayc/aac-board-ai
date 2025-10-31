import { useEffect, useState } from "react";

export function useSpeechSynthesis() {
  const isSupported = "speechSynthesis" in window;
  const synth = window.speechSynthesis;

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const [voiceURI, setVoiceURI] = useState("");
  const [pitch, setPitch] = useState(1);
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(1);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const langs = Array.from(new Set(voices.map((v) => v.lang))).sort((a, b) =>
    a.localeCompare(b)
  );

  const voicesByLang = voices.reduce<Record<string, SpeechSynthesisVoice[]>>(
    (acc, voice) => {
      const lang = voice.lang.split("-")[0];

      if (!acc[lang]) {
        acc[lang] = [];
      }

      acc[lang].push(voice);
      return acc;
    },
    {}
  );

  const speak = async (text: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!isSupported) {
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
        setIsPaused(false);
        setIsSpeaking(true);
      };

      utterance.onpause = () => {
        setIsPaused(true);
        setIsSpeaking(false);
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
    setIsPaused(true);
  };

  const resume = () => {
    synth.resume();
    setIsPaused(false);
  };

  useEffect(() => {
    const getVoices = () => {
      const voices = synth.getVoices();
      setVoices(voices);

      if (!voiceURI && voices.length > 0) {
        const defaultVoice = voices.find((v) => v.default) ?? voices[0];

        setVoiceURI(defaultVoice.voiceURI);
      }
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
    isSupported,
    isSpeaking,
    isPaused,
    langs,
    voicesByLang,
  };
}
