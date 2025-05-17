"use client"

import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import type { CardSet, Flashcard, GenerateState, LibraryState, StudyState, LearningStats } from "@/types"
import type { StudySession as DbStudySession } from "@/types/progress"; // 型インポート
import { generateId } from "@/lib/utils"

interface Store {
  generate: GenerateState
  library: LibraryState
  study: StudyState

  // Generate Actions
  setInputType: (type: "file" | "url" | "text" | null) => void
  setInputValue: (value: string) => void
  setGenerationOptions: (options: Partial<GenerateState["generationOptions"]>) => void
  generatePreview: () => Promise<void>
  updatePreviewCard: (index: number, updates: Partial<Flashcard>) => void
  addPreviewCard: (card: Omit<Flashcard, "id">) => void
  deletePreviewCard: (index: number) => void
  setCardSetName: (name: string) => void
  setCardSetTheme: (theme: string) => void
  setCardSetTags: (tags: string[]) => void
  resetGenerator: () => void

  // Library Actions
  setAllCardSets: (cardSets: CardSet[]) => void
  setAvailableThemes: (themes: string[]) => void
  setAvailableTags: (tags: { id: string; name: string }[]) => void
  setFilterTheme: (theme: string | null) => void
  addFilterTag: (tag: string) => void
  removeFilterTag: (tag: string) => void
  resetFilters: () => void

  // Study Actions
  startStudySession: (cardSetIds: string[], cards: Flashcard[]) => void
  flipCard: () => void
  nextCard: () => void
  previousCard: () => void
  fetchHint: () => Promise<void>
  hideHint: () => void
  fetchDetails: () => Promise<void>
  hideDetails: () => void
  shuffleDeck: () => void
  resetStudySession: () => void

  // 学習進捗関連のアクション
  markCardResult: (result: "correct" | "incorrect" | "skipped") => void
  finishStudySession: () => Promise<void>
  getCardSetStats: (cardSetId: string) => Promise<LearningStats>
}

const initialGenerateState: GenerateState = {
  inputType: null,
  inputValue: "",
  generationOptions: {
    cardType: "term-definition",
    language: "japanese",
    additionalPrompt: "",
  },
  previewCards: [],
  isLoading: false,
  error: null,
  warningMessage: null,
  cardSetName: "",
  cardSetTheme: "default",
  cardSetTags: [],
}

const initialLibraryState: LibraryState = {
  allCardSets: [],
  filteredCardSets: [],
  filterTheme: null,
  filterTags: [],
  availableThemes: [],
  availableTags: [],
  isLoading: false,
  error: null,
}

const initialStudyState: StudyState = {
  activeCardSetIds: [],
  originalDeck: [],
  currentDeck: [],
  currentCardIndex: 0,
  currentCard: null,
  isFrontVisible: true,
  currentHint: undefined, // TypeScriptエラー(ts2322)修正
  isHintLoading: false,
  currentDetails: undefined, // TypeScriptエラー(ts2322)修正
  isDetailsLoading: false,
  error: null,
  sessionStartTime: null,
  sessionCardResults: [],
}

export const useStore = create<Store>()(
  immer((set, get) => ({
    generate: initialGenerateState,
    library: initialLibraryState,
    study: initialStudyState,

    // Generate Actions
    setInputType: (type) =>
      set((state) => {
        state.generate.inputType = type
        return state
      }),

    setInputValue: (value) =>
      set((state) => {
        state.generate.inputValue = value
        return state
      }),

    setGenerationOptions: (options) =>
      set((state) => {
        state.generate.generationOptions = {
          ...state.generate.generationOptions,
          ...options,
        }
        return state
      }),

    generatePreview: async () => {
      const { inputType, inputValue, generationOptions } = get().generate

      if (!inputType || !inputValue) {
        set((state) => {
          state.generate.error = "入力内容を確認してください"
          return state
        })
        return
      }

      set((state) => {
        state.generate.isLoading = true
        state.generate.error = null
        return state
      })

      try {
        let content = inputValue

        if (inputType === "url") {
          try {
            const response = await fetch(`/api/fetch-url-content?url=${encodeURIComponent(inputValue)}`)
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: "URLからのコンテンツ取得に失敗しました" }))
              throw new Error(errorData.error || "URLからのコンテンツ取得に失敗しました")
            }
            const data = await response.json()
            if (!data.content) {
              throw new Error("URLから有効なコンテンツを取得できませんでした")
            }
            content = data.content
          } catch (error) {
            throw new Error(
              `URLからのコンテンツ取得に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`,
            )
          }
        }

        try {
          const response = await fetch("/api/generate-cards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inputType, inputValue: content, generationOptions }),
          })
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "カード生成に失敗しました" }))
            throw new Error(errorData.error || "カード生成に失敗しました")
          }
          const data = await response.json()
          if (!data.cards || !Array.isArray(data.cards) || data.cards.length === 0) {
            throw new Error("有効なカードデータが生成されませんでした")
          }
          set((state) => {
            state.generate.previewCards = data.cards.map((card: Omit<Flashcard, "id">) => ({
              ...card,
              id: generateId(),
              learningStatus: "new",
              reviewCount: 0,
              correctCount: 0,
              incorrectCount: 0,
            }))
            state.generate.isLoading = false
            return state
          })
        } catch (apiError) {
          throw new Error(`カード生成APIエラー: ${apiError instanceof Error ? apiError.message : "不明なエラー"}`)
        }
      } catch (error) {
        set((state) => {
          state.generate.error = error instanceof Error ? error.message : "不明なエラーが発生しました"
          state.generate.isLoading = false
          return state
        })
      }
    },

    updatePreviewCard: (index, updates) =>
      set((state) => {
        if (index >= 0 && index < state.generate.previewCards.length) {
          state.generate.previewCards[index] = {
            ...state.generate.previewCards[index],
            ...updates,
          }
        }
        return state
      }),

    addPreviewCard: (card) =>
      set((state) => {
        state.generate.previewCards.push({
          ...card,
          id: generateId(),
          learningStatus: "new",
          reviewCount: 0,
          correctCount: 0,
          incorrectCount: 0,
        })
        return state
      }),

    deletePreviewCard: (index) =>
      set((state) => {
        if (index >= 0 && index < state.generate.previewCards.length) {
          state.generate.previewCards.splice(index, 1)
        }
        return state
      }),

    setCardSetName: (name) => set((state) => { state.generate.cardSetName = name; return state }),
    setCardSetTheme: (theme) => set((state) => { state.generate.cardSetTheme = theme; return state }),
    setCardSetTags: (tags) => set((state) => { state.generate.cardSetTags = tags; return state }),
    resetGenerator: () => set((state) => { state.generate = initialGenerateState; return state }),

    // Library Actions
    setAllCardSets: (cardSets) =>
      set((state) => {
        state.library.allCardSets = cardSets
        const { filterTheme, filterTags } = state.library
        state.library.filteredCardSets = cardSets.filter((cardSet) => {
          const matchesTheme = !filterTheme || cardSet.theme === filterTheme
          const matchesTags = filterTags.length === 0 || filterTags.every((tag) => cardSet.tags.includes(tag))
          return matchesTheme && matchesTags
        })
        return state
      }),

    setAvailableThemes: (themes) => set((state) => { state.library.availableThemes = themes; return state }),
    setAvailableTags: (tags) => set((state) => { state.library.availableTags = tags; return state }),

    setFilterTheme: (theme) =>
      set((state) => {
        state.library.filterTheme = theme
        const { allCardSets, filterTags } = state.library
        state.library.filteredCardSets = allCardSets.filter((cardSet) => {
          const matchesTheme = !theme || cardSet.theme === theme
          const matchesTags = filterTags.length === 0 || filterTags.every((tag) => cardSet.tags.includes(tag))
          return matchesTheme && matchesTags
        })
        return state
      }),

    addFilterTag: (tag) =>
      set((state) => {
        if (!state.library.filterTags.includes(tag)) {
          state.library.filterTags.push(tag)
          const { allCardSets, filterTheme } = state.library
          state.library.filteredCardSets = allCardSets.filter((cardSet) => {
            const matchesTheme = !filterTheme || cardSet.theme === filterTheme
            const matchesTags = state.library.filterTags.every((t) => cardSet.tags.includes(t))
            return matchesTheme && matchesTags
          })
        }
        return state
      }),

    removeFilterTag: (tag) =>
      set((state) => {
        state.library.filterTags = state.library.filterTags.filter((t) => t !== tag)
        const { allCardSets, filterTheme } = state.library
        state.library.filteredCardSets = allCardSets.filter((cardSet) => {
          const matchesTheme = !filterTheme || cardSet.theme === filterTheme
          const matchesTags = state.library.filterTags.length === 0 || state.library.filterTags.every((t) => cardSet.tags.includes(t))
          return matchesTheme && matchesTags
        })
        return state
      }),

    resetFilters: () =>
      set((state) => {
        state.library.filterTheme = null
        state.library.filterTags = []
        state.library.filteredCardSets = state.library.allCardSets
        return state
      }),

    // Study Actions
    startStudySession: (cardSetIds, cards) =>
      set((state) => {
        const primaryCardSetId = cardSetIds[0];
        const cardsWithSetId = cards.map(card => ({ ...card, cardSetId: primaryCardSetId }));
        const shuffledCards = [...cardsWithSetId].sort(() => Math.random() - 0.5)
        state.study = {
          ...initialStudyState,
          activeCardSetIds: cardSetIds,
          originalDeck: cardsWithSetId,
          currentDeck: shuffledCards,
          currentCardIndex: 0,
          currentCard: shuffledCards.length > 0 ? shuffledCards[0] : null,
          sessionStartTime: new Date(),
          sessionCardResults: [],
        }
        return state
      }),

    flipCard: () => set((state) => { state.study.isFrontVisible = !state.study.isFrontVisible; return state }),

    nextCard: () =>
      set((state) => {
        const { currentCardIndex, currentDeck } = state.study
        const nextIndex = (currentCardIndex + 1) % currentDeck.length
        state.study.currentCardIndex = nextIndex
        state.study.currentCard = currentDeck[nextIndex]
        state.study.isFrontVisible = true
        state.study.currentHint = undefined // TypeScriptエラー(ts2322)修正
        state.study.currentDetails = undefined // TypeScriptエラー(ts2322)修正
        return state
      }),

    previousCard: () =>
      set((state) => {
        const { currentCardIndex, currentDeck } = state.study
        const prevIndex = (currentCardIndex - 1 + currentDeck.length) % currentDeck.length
        state.study.currentCardIndex = prevIndex
        state.study.currentCard = currentDeck[prevIndex]
        state.study.isFrontVisible = true
        state.study.currentHint = undefined // TypeScriptエラー(ts2322)修正
        state.study.currentDetails = undefined // TypeScriptエラー(ts2322)修正
        return state
      }),

    fetchHint: async () => {
      const { currentCard } = get().study
      if (!currentCard) return
      if (currentCard.hint) {
        set((state) => { state.study.currentHint = currentCard.hint; return state })
        return
      }
      set((state) => { state.study.isHintLoading = true; return state })
      try {
        const response = await fetch("/api/generate-hint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ front: currentCard.front, back: currentCard.back }),
        })
        if (!response.ok) throw new Error("ヒント生成に失敗しました")
        const data = await response.json()
        const hint = data.hint
        set((state) => {
          state.study.currentHint = hint
          state.study.isHintLoading = false
          const cardIndex = state.study.currentDeck.findIndex((card) => card.id === currentCard.id)
          if (cardIndex !== -1) {
            state.study.currentDeck[cardIndex].hint = hint
            const originalIndex = state.study.originalDeck.findIndex((card) => card.id === currentCard.id)
            if (originalIndex !== -1) state.study.originalDeck[originalIndex].hint = hint
          }
          return state
        })
      } catch (error) {
        set((state) => {
          state.study.error = error instanceof Error ? error.message : "不明なエラーが発生しました"
          state.study.isHintLoading = false
          return state
        })
      }
    },

    hideHint: () => set((state) => { state.study.currentHint = undefined; return state }), // TypeScriptエラー(ts2322)修正

    fetchDetails: async () => {
      const { currentCard } = get().study
      if (!currentCard) return
      if (currentCard.details) {
        set((state) => { state.study.currentDetails = currentCard.details; return state })
        return
      }
      set((state) => { state.study.isDetailsLoading = true; return state })
      try {
        const response = await fetch("/api/generate-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ front: currentCard.front, back: currentCard.back }),
        })
        if (!response.ok) throw new Error("詳細説明の生成に失敗しました")
        const data = await response.json()
        const details = data.details
        set((state) => {
          state.study.currentDetails = details
          state.study.isDetailsLoading = false
          const cardIndex = state.study.currentDeck.findIndex((card) => card.id === currentCard.id)
          if (cardIndex !== -1) {
            state.study.currentDeck[cardIndex].details = details
            const originalIndex = state.study.originalDeck.findIndex((card) => card.id === currentCard.id)
            if (originalIndex !== -1) state.study.originalDeck[originalIndex].details = details
          }
          return state
        })
      } catch (error) {
        set((state) => {
          state.study.error = error instanceof Error ? error.message : "不明なエラーが発生しました"
          state.study.isDetailsLoading = false
          return state
        })
      }
    },

    hideDetails: () => set((state) => { state.study.currentDetails = undefined; return state }), // TypeScriptエラー(ts2322)修正

    shuffleDeck: () =>
      set((state) => {
        const shuffledDeck = [...state.study.currentDeck].sort(() => Math.random() - 0.5)
        state.study.currentDeck = shuffledDeck
        state.study.currentCardIndex = 0
        state.study.currentCard = shuffledDeck.length > 0 ? shuffledDeck[0] : null
        state.study.isFrontVisible = true
        state.study.currentHint = undefined // TypeScriptエラー(ts2322)修正
        state.study.currentDetails = undefined // TypeScriptエラー(ts2322)修正
        return state
      }),

    resetStudySession: () => set((state) => { state.study = initialStudyState; return state }),

    markCardResult: (result) =>
      set((state) => {
        const { currentCard, sessionStartTime } = state.study
        if (!currentCard || !sessionStartTime) return state
        const timeSpent = new Date().getTime() - sessionStartTime.getTime()
        state.study.sessionCardResults.push({ cardId: currentCard.id, result, timeSpent })
        state.study.sessionStartTime = new Date()
        return state
      }),

    finishStudySession: async () => {
      const { activeCardSetIds, sessionCardResults, originalDeck } = get().study
      if (activeCardSetIds.length === 0 || sessionCardResults.length === 0) return
      try {
        // @ts-expect-error - IndexedDBの関数は動的にインポートされるため、型推論が難しい場合がある。必要に応じて型アサーションを検討。
        const { saveStudySession } = await import("@/lib/indexed-db")
        const totalTimeSpent = sessionCardResults.reduce((sum, r) => sum + r.timeSpent, 0)
        for (const cardSetId of activeCardSetIds) {
          const cardIds = originalDeck.filter((card) => card.cardSetId === cardSetId).map((card) => card.id)
          const filteredResults = sessionCardResults.filter((r) => cardIds.includes(r.cardId))
          if (filteredResults.length === 0) continue
          await saveStudySession({
            cardSetId,
            date: new Date(),
            duration: totalTimeSpent,
            cardsReviewed: filteredResults.length,
            correctAnswers: filteredResults.filter((r) => r.result === "correct").length,
            incorrectAnswers: filteredResults.filter((r) => r.result === "incorrect").length,
            skippedCards: filteredResults.filter((r) => r.result === "skipped").length,
            cardResults: filteredResults,
          })
        }
        set((state) => { state.study = initialStudyState; return state })
      } catch (error) {
        console.error("学習セッションの保存に失敗しました:", error)
        throw error
      }
    },

    getCardSetStats: async (cardSetId) => {
      try {
        // @ts-expect-error - IndexedDBの関数は動的にインポートされるため、型推論が難しい場合がある。必要に応じて型アサーションを検討。
        const { getCardSetStats: getDbCardSetStats, getStudySessions } = await import("@/lib/indexed-db");

        const stats = await getDbCardSetStats(cardSetId);
        const sessions: DbStudySession[] = await getStudySessions(cardSetId);

        let streak = 0;
        let lastDateForStreak: Date | null = null;

        if (sessions.length > 0) {
          const sortedSessions = [...sessions].sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()); // completedAt を使用
          if (sortedSessions[0].completedAt) { // completedAt が null でないことを確認
            lastDateForStreak = new Date(sortedSessions[0].completedAt);
          }


          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          if (lastDateForStreak) {
            const lastStudyDateForStreak = new Date(lastDateForStreak);
            lastStudyDateForStreak.setHours(0, 0, 0, 0);

            if (lastStudyDateForStreak.getTime() === today.getTime() || lastStudyDateForStreak.getTime() === yesterday.getTime()) {
              streak = 1;
              let currentDate = yesterday;
              for (let i = 1; i < sortedSessions.length; i++) {
                if (sortedSessions[i].completedAt) { // completedAt が null でないことを確認
                    const sessionDate = new Date(sortedSessions[i].completedAt!);
                    sessionDate.setHours(0, 0, 0, 0);
                    const prevDate = new Date(currentDate);
                    prevDate.setDate(prevDate.getDate() - 1);
                    if (sessionDate.getTime() === prevDate.getTime()) {
                        streak++;
                        currentDate = prevDate;
                    } else if (sessionDate.getTime() > prevDate.getTime()) {
                        // 同じ日に複数のセッションがある場合や、日付が飛んでいるがストリークが継続する場合の考慮（必要に応じて）
                        // このロジックでは単純に前日でない場合はストリーク終了
                    }
                    else {
                        break;
                    }
                }
              }
            }
          }
        }

        const totalTime = sessions.reduce((sum, session) => sum + session.totalTimeSpent, 0);
        const totalCards = sessions.reduce((sum, session) => sum + session.cardsReviewed, 0);
        const averageTimePerCard = totalCards > 0 ? totalTime / totalCards : 0;

        const dailyGoal = 10;
        const todayForGoal = new Date();
        todayForGoal.setHours(0, 0, 0, 0);

        const todaySessions = sessions.filter((session) => {
          if (session.completedAt) { // completedAt が null でないことを確認
            const sessionDate = new Date(session.completedAt);
            sessionDate.setHours(0, 0, 0, 0);
            return sessionDate.getTime() === todayForGoal.getTime();
          }
          return false;
        });

        const todayCards = todaySessions.reduce((sum, session) => sum + session.cardsReviewed, 0);
        const dailyGoalMet = todayCards >= dailyGoal;

        return {
          totalReviews: stats.totalReviews,
          correctReviews: stats.correctReviews,
          incorrectReviews: stats.incorrectReviews,
          masteredCards: stats.masteredCards, // `stats` から取得する想定 (getDbCardSetStats の返り値)
          accuracy: stats.totalReviews > 0 ? (stats.correctReviews / stats.totalReviews) * 100 : 0,
          averageTimePerCard,
          studySessionsCompleted: stats.studySessionsCompleted, // `stats` から取得する想定
          lastStudyDate: stats.lastStudyDate, // `stats` から取得する想定
          studyStreak: streak,
          dailyGoalMet,
        };
      } catch (error) {
        console.error("統計情報の取得に失敗しました:", error);
        throw error;
      }
    },
  })),
);
