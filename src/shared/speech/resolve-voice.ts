import {
  getLanguageCode,
  getLikelyRegionCode,
  getRegionCode,
} from "@shared/language/locale";

export type VoicesByLanguage = Partial<
  Record<string, readonly SpeechSynthesisVoice[]>
>;

export function resolveVoice(
  voicesByLanguage: VoicesByLanguage,
  language: string,
  savedVoiceURI: string | null,
  preferredLocales: readonly string[] = navigator.languages,
): SpeechSynthesisVoice | null {
  const voices = voicesByLanguage[language] ?? [];
  const savedVoice = voices.find((voice) => voice.voiceURI === savedVoiceURI);

  return savedVoice ?? findFallbackVoice(voices, language, preferredLocales);
}

function findFallbackVoice(
  voices: readonly SpeechSynthesisVoice[],
  language: string,
  preferredLocales: readonly string[],
): SpeechSynthesisVoice | null {
  const regionCode = findPreferredRegionCode(language, preferredLocales);
  const regionVoices = voices.filter(
    (voice) => getRegionCode(voice.lang) === regionCode,
  );
  const candidates = regionVoices.length > 0 ? regionVoices : voices;

  return candidates.find((voice) => voice.default) ?? candidates[0] ?? null;
}

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
