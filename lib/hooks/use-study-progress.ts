"use client"

import { useState, useEffect, useCallback } from "react"
import type { CardProgress, StudySession, LearningStats } from "@/types/progress"
import type { Flashcard } from "@/types"

export const useStudyProgress = (cardSetId: string) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [stats, setStats] = useState<LearningStats | null>(null)
  const [cardProgress, setCardProgress] = useState<Record<string, CardProgress>>({})
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null)

  // 学習統計を取得
  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // 動的インポート
      const indexedDB = await import("@/lib/indexed-db")
      const stats = await indexedDB.calculateCardSetStats(cardSetId)
      setStats(stats)

      // カード進捗情報を取得
      const progress = await indexedDB.getCardProgressByCardSetId(cardSetId)
      const progressMap: Record<string, CardProgress> = {}
      progress.forEach((p) => {
        progressMap[p.cardId] = p
      })
      setCardProgress(progressMap)
    } catch (err) {
      console.error("Failed to load study progress:", err)
      setError(err instanceof Error ? err : new Error("Unknown error"))
    } finally {
      setIsLoading(false)
    }
  }, [cardSetId])

  // 初期データ読み込み
  useEffect(() => {
    loadStats()
  }, [loadStats])

  // 学習セッションを開始
  const startStudySession = useCallback(async () => {
    try {
      const indexedDB = await import("@/lib/indexed-db")
      const session: Omit<StudySession, "id"> = {
        cardSetId,
        startedAt: new Date(),
        completedAt: null,
        cardsReviewed: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        totalTimeSpent: 0,
      }
      const sessionId = await indexedDB.addStudySession(session)
      const newSession = await indexedDB
        .getAllStudySessions()
        .then((sessions) => sessions.find((s) => s.id === sessionId))
      setCurrentSession(newSession || null)
      return sessionId
    } catch (err) {
      console.error("Failed to start study session:", err)
      throw err instanceof Error ? err : new Error("Failed to start study session")
    }
  }, [cardSetId])

  // 学習セッションを終了
  const completeStudySession = useCallback(
    async (
      sessionId: string,
      stats: {
        cardsReviewed: number
        correctAnswers: number
        incorrectAnswers: number
        totalTimeSpent: number
      },
    ) => {
      try {
        const indexedDB = await import("@/lib/indexed-db")
        await indexedDB.updateStudySession(sessionId, {
          ...stats,
          completedAt: new Date(),
        })
        setCurrentSession(null)
        await loadStats() // 統計を更新
      } catch (err) {
        console.error("Failed to complete study session:", err)
        throw err instanceof Error ? err : new Error("Failed to complete study session")
      }
    },
    [loadStats],
  )

  // カードの回答を記録
  const recordCardAnswer = useCallback(
    async (card: Flashcard, isCorrect: boolean, timeSpent: number) => {
      try {
        const indexedDB = await import("@/lib/indexed-db")
        const progress = cardProgress[card.id]

        if (!progress) {
          throw new Error(`Progress for card ${card.id} not found`)
        }

        // SMR2アルゴリズムに基づいて次の復習日を計算
        const now = new Date()
        let { easeFactor, interval, status, correctCount, incorrectCount } = progress

        if (isCorrect) {
          correctCount++

          // 正解の場合、ステータスを更新
          if (status === "new") {
            status = "learning"
            interval = 1
          } else if (status === "learning") {
            if (correctCount >= 3) {
              status = "mastered"
            }
            interval = Math.round(interval * easeFactor)
          } else {
            interval = Math.round(interval * easeFactor)
          }

          // 難易度係数を調整（最大2.5）
          easeFactor = Math.min(easeFactor + 0.1, 2.5)
        } else {
          incorrectCount++

          // 不正解の場合、ステータスを下げる
          if (status === "mastered") {
            status = "learning"
          }

          // 間隔をリセット
          interval = 1

          // 難易度係数を調整（最小1.3）
          easeFactor = Math.max(easeFactor - 0.2, 1.3)
        }

        // 次の復習日を設定
        const nextReviewAt = new Date(now)
        nextReviewAt.setDate(nextReviewAt.getDate() + interval)

        // 進捗を更新
        await indexedDB.updateCardProgress(progress.id, {
          status,
          easeFactor,
          interval,
          correctCount,
          incorrectCount,
          lastReviewedAt: now,
          nextReviewAt,
        })

        // 現在のセッション情報を更新
        if (currentSession) {
          await indexedDB.updateStudySession(currentSession.id, {
            cardsReviewed: currentSession.cardsReviewed + 1,
            correctAnswers: currentSession.correctAnswers + (isCorrect ? 1 : 0),
            incorrectAnswers: currentSession.incorrectAnswers + (isCorrect ? 0 : 1),
            totalTimeSpent: currentSession.totalTimeSpent + timeSpent,
          })

          // セッション情報を更新
          const updatedSession = await indexedDB
            .getAllStudySessions()
            .then((sessions) => sessions.find((s) => s.id === currentSession.id))
          setCurrentSession(updatedSession || null)
        }

        // 進捗情報を更新
        await loadStats()

        // 更新された進捗を返す
        return {
          status,
          easeFactor,
          interval,
          nextReviewAt,
        }
      } catch (err) {
        console.error("Failed to record card answer:", err)
        throw err instanceof Error ? err : new Error("Failed to record card answer")
      }
    },
    [cardProgress, currentSession, loadStats],
  )

  return {
    isLoading,
    error,
    stats,
    cardProgress,
    currentSession,
    startStudySession,
    completeStudySession,
    recordCardAnswer,
    refreshStats: loadStats,
  }
}
