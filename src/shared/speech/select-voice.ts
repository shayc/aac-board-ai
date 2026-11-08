import {
  getLanguageCode,
  getLikelyRegionCode,
  getRegionCode,
} from "@shared/language/locale";

function findPreferredRegionCode(
  language: string,
  preferredLocales: readonly string[],
): string | undefined {
  for (const locale of preferredLocales) {
    if (getLanguageCode(locale) !== language) {
      continue;
    }

    const region = getRegionCode(locale);
    if (region) {
      return region;
    }
  }

  return getLikelyRegionCode(language);
}

function selectFallbackVoice(
  voices: SpeechSynthesisVoice[],
  language: string,
  preferredLocales: readonly string[],
): SpeechSynthesisVoice | undefined {
  const regionCode = findPreferredRegionCode(language, preferredLocales);
  const regionVoices = voices.filter(
    (voice) => getRegionCode(voice.lang) === regionCode,
  );
  const candidates = regionVoices.length > 0 ? regionVoices : voices;

  return candidates.find((voice) => voice.default) ?? candidates[0];
}

export function selectVoice(
  voices: SpeechSynthesisVoice[],
  language: string,
  savedVoiceURI: string | null,
  preferredLocales: readonly string[] = globalThis.navigator?.languages ?? [],
): SpeechSynthesisVoice | undefined {
  const savedVoice = voices.find((voice) => voice.voiceURI === savedVoiceURI);

  return savedVoice ?? selectFallbackVoice(voices, language, preferredLocales);
}
