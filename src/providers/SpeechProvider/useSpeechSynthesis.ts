import { useEffect, useState } from "react";

export function useSpeechSynthesis() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState("");
  const [pitch, setPitch] = useState(1);
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(1);

  const isSupported = "speechSynthesis" in window;

  const speak = (text: string) => {
    if (!isSupported) {
      console.warn("Speech synthesis is not supported in this browser");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const selectedVoice = voices.find((v) => v.voiceURI === voiceURI);

    utterance.voice = selectedVoice || null;
    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.volume = volume;

    window.speechSynthesis.speak(utterance);
  };

  const cancel = () => {
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
  };

  const getVoices = () => {
    if (isSupported) {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      if (!voiceURI && availableVoices.length > 0) {
        const defaultVoice =
          availableVoices.find((voice) => voice.default) || availableVoices[0];

        const newVoiceURI = defaultVoice.voiceURI;
        setVoiceURI(newVoiceURI);
      }
    }
  };

  useEffect(() => {
    if (isSupported) {
      getVoices();
      window.speechSynthesis.onvoiceschanged = getVoices;
    }
  }, []);

  return {
    voices,
    voiceURI,
    setVoiceURI,
    pitch,
    setPitch,
    rate,
    setRate,
    volume,
    setVolume,
    speak,
    cancel,
    isSupported,
  };
}
