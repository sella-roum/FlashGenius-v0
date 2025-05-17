export interface Tag {
  id: string
  name: string
}

export interface Flashcard {
  id: string
  front: string
  back: string
  frontImage?: string
  backImage?: string
  hint?: string
  details?: string
  cardSetId?: string; // ESLint修正: store.tsでの使用のため追加
  // 学習進捗関連のフィールドを追加
  learningStatus: "new" | "learning" | "mastered"
  lastReviewed?: Date
  nextReviewDate?: Date
  reviewCount: number
  correctCount: number
  incorrectCount: number
}

export interface CardSet {
  id: string
  name: string
  description?: string
  theme?: string
  tags: string[]
  cards: Flashcard[]
  createdAt: Date
  updatedAt: Date
  sourceType?: "file" | "url" | "text"
  sourceValue?: string
  // 学習進捗関連のフィールドを追加
  lastStudied?: Date
  totalCards: number
  masteredCards: number
  learningCards: number
  newCards: number
  studySessionCount: number
}

export interface GenerationOptions {
  cardType: "term-definition" | "qa" | "image-description"
  language: string
  additionalPrompt?: string
}

export interface GenerateState {
  inputType: "file" | "url" | "text" | null
  inputValue: string
  generationOptions: GenerationOptions
  previewCards: Flashcard[]
  isLoading: boolean
  error: string | null
  warningMessage: string | null
  cardSetName: string
  cardSetTheme: string
  cardSetTags: string[]
}

export interface LibraryState {
  allCardSets: CardSet[]
  filteredCardSets: CardSet[]
  filterTheme: string | null
  filterTags: string[]
  availableThemes: string[]
  availableTags: Tag[]
  isLoading: boolean
  error: string | null
}

export interface StudyState {
  activeCardSetIds: string[];
  originalDeck: Flashcard[];
  currentDeck: Flashcard[];
  currentCardIndex: number;
  currentCard: Flashcard | null;
  isFrontVisible: boolean;
  currentHint: string | undefined; // null から undefined に変更
  isHintLoading: boolean;
  currentDetails: string | undefined; // null から undefined に変更
  isDetailsLoading: boolean;
  error: string | null;
  sessionStartTime: Date | null;
  sessionCardResults: {
    cardId: string;
    result: "correct" | "incorrect" | "skipped";
    timeSpent: number;
  }[];
}

// 学習進捗の統計情報
export interface LearningStats {
  totalReviews: number
  correctReviews: number
  incorrectReviews: number
  masteredCards: number
  accuracy: number
  averageTimePerCard: number
  studySessionsCompleted: number
  lastStudyDate: Date | null
  studyStreak: number
  dailyGoalMet: boolean
}
