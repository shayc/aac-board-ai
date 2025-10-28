export interface AICapabilities {
  languageModel: boolean;
  translator: boolean;
  writer: boolean;
  rewriter: boolean;
  languageDetector: boolean;
  proofreader: boolean;
}

export function useAICapabilities(): AICapabilities {
  return {
    languageModel: "LanguageModel" in self,
    translator: "Translator" in self,
    writer: "Writer" in self,
    rewriter: "Rewriter" in self,
    languageDetector: "LanguageDetector" in self,
    proofreader: "Proofreader" in self,
  };
}
