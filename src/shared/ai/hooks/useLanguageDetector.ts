export function useLanguageDetector() {
  const isSupported = "LanguageDetector" in self;

  return {
    isSupported,
  };
}
