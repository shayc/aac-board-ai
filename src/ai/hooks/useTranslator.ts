export function useTranslator() {
  const isSupported = "Translator" in self;

  return {
    isSupported,
  };
}
