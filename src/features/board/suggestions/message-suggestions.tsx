import type { Board } from "@features/library";
import type { TilePart } from "../message/message-types";
import { SuggestionBar } from "./suggestion-bar";
import { useMessageSuggestions } from "./use-message-suggestions";
import { useNearbyVocabulary } from "./use-nearby-vocabulary";

interface MessageSuggestionsProps {
  board: Board;
  /** The language the board's text is in, when known. */
  boardLanguage: string | undefined;
  rootBoardId: string | undefined;
  messageText: string;
  isWordOpen: boolean;
  language: string;
  onPhraseSelect: (phrase: string) => void;
  onContinuationSelect: (parts: readonly TilePart[]) => void;
}

export function MessageSuggestions({
  board,
  boardLanguage,
  rootBoardId,
  messageText,
  isWordOpen,
  language,
  onPhraseSelect,
  onContinuationSelect,
}: MessageSuggestionsProps) {
  const nearbyVocabulary = useNearbyVocabulary({
    board,
    boardLanguage,
    rootBoardId,
  });
  const suggestions = useMessageSuggestions(messageText, {
    vocabulary: nearbyVocabulary.words,
    isWordOpen,
  });

  if (!suggestions.isAvailable) {
    return null;
  }

  function selectContinuation(words: readonly string[]) {
    void nearbyVocabulary.loadTileParts(words).then(onContinuationSelect);
  }

  return (
    <SuggestionBar
      status={suggestions.status}
      phrases={suggestions.phrases}
      messageText={messageText}
      continuations={suggestions.continuations}
      language={language}
      onEnable={suggestions.enable}
      onPhraseSelect={onPhraseSelect}
      onContinuationSelect={selectContinuation}
    />
  );
}
