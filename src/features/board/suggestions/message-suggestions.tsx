import { SuggestionBar } from "./suggestion-bar";
import { useMessageSuggestions } from "./use-message-suggestions";

interface MessageSuggestionsProps {
  messageText: string;
  language: string;
  onPhraseSelect: (phrase: string) => void;
}

export function MessageSuggestions({
  messageText,
  language,
  onPhraseSelect,
}: MessageSuggestionsProps) {
  const suggestions = useMessageSuggestions(messageText);

  if (!suggestions.isAvailable) {
    return null;
  }

  return (
    <SuggestionBar
      status={suggestions.status}
      phrases={suggestions.phrases}
      language={language}
      onEnable={suggestions.enable}
      onPhraseSelect={onPhraseSelect}
    />
  );
}
