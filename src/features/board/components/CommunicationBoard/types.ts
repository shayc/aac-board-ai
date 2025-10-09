export interface Grid {
  rows: number;
  columns: number;
  order?: (string | null)[][];
}

export interface BoardImage {
  id: string;
  data?: string;
  url?: string;
  contentType?: string;
}

export interface BoardSound {
  id: string;
  data?: string;
  url?: string;
  contentType?: string;
}

export interface LoadBoard {
  name: string;
  url?: string;
  data_url?: string;
  path?: string;
}

export interface BoardButton {
  id: string;
  label: string;
  vocalization?: string;
  backgroundColor?: string;
  borderColor?: string;
  imageId?: string;
  soundId?: string;
  action?: string;
  actions?: string[];
  loadBoard?: LoadBoard;
}

export interface Board {
  id: string;
  name: string;
  buttons: BoardButton[];
  grid: Grid;
  images?: BoardImage[];
  sounds?: BoardSound[];
}

// Sentence/Output types
export interface SentenceContent {
  id: string;
  label: string;
  image?: string;
  vocalization?: string;
}

// State types
export interface NavigationState {
  currentBoardId: string;
  history: string[];
  boards: Map<string, Board>;
}

export interface OutputState {
  words: SentenceContent[];
}

export interface SuggestionsState {
  suggestions: string[];
  tone: "neutral" | "formal" | "casual";
  isGenerating: boolean;
  proofreaderStatus?: string;
}

// Context value type
export interface BoardContextValue {
  // Navigation
  currentBoardId: string;
  currentBoard: Board | null;
  history: string[];
  canGoBack: boolean;
  goToBoard: (boardId: string) => void;
  goBack: () => void;
  goHome: () => void;

  // Output
  words: SentenceContent[];
  addWord: (word: SentenceContent) => void;
  removeWord: () => void;
  clearWords: () => void;

  // Suggestions
  suggestions: string[];
  tone: "neutral" | "formal" | "casual";
  isGenerating: boolean;
  changeTone: (tone: "neutral" | "formal" | "casual") => void;
  regenerateSuggestions: () => void;
  requestProofreaderSession: () => Promise<void>;
  proofreaderStatus: string;

  // Boards
  boards: Map<string, Board>;
  isLoading: boolean;
  error: Error | null;
  loadBoard: (boardId: string) => Promise<void>;
  reloadBoard: () => Promise<void>;
}
