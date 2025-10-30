export interface AICapabilities {
  isLanguageModelSupported: boolean;
  isTranslatorSupported: boolean;
  isWriterSupported: boolean;
  isRewriterSupported: boolean;
  isLanguageDetectorSupported: boolean;
  isProofreaderSupported: boolean;
}

export function useAICapabilities(): AICapabilities {
  return {
    isLanguageModelSupported: "LanguageModel" in self,
    isTranslatorSupported: "Translator" in self,
    isWriterSupported: "Writer" in self,
    isRewriterSupported: "Rewriter" in self,
    isLanguageDetectorSupported: "LanguageDetector" in self,
    isProofreaderSupported: "Proofreader" in self,
  };
}
