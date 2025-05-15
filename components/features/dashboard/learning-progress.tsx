"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useIndexedDB } from "@/lib/hooks/use-indexed-db"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { Award, BarChart2, BookOpen, Calendar } from "lucide-react"

export const LearningProgress = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [overallStats, setOverallStats] = useState<{
    totalCards: number
    masteredCards: number
    studyStreak: number
    lastStudyDate: Date | null
    totalSessions: number
  } | null>(null)

  const { allCardSets } = useIndexedDB()

  useEffect(() => {
    const calculateOverallStats = async () => {
      if (!allCardSets) return

      try {
        setIsLoading(true)
        setError(null)

        const indexedDB = await import("@/lib/indexed-db")
        const allSessions = await indexedDB.getAllStudySessions()
        const completedSessions = allSessions.filter((session) => session.completedAt !== null)

        // 各カードセットの統計を取得
        const statsPromises = allCardSets.map((set) => indexedDB.calculateCardSetStats(set.id))
        const allStats = await Promise.all(statsPromises)

        // 総カード数
        const totalCards = allCardSets.reduce((sum, set) => sum + set.cards.length, 0)

        // マスターしたカード数の合計
        const masteredCards = allStats.reduce((sum, stat) => {
          const setIndex = allCardSets.findIndex((set) => allSessions.some((session) => session.cardSetId === set.id))
          if (setIndex === -1) return sum
          const cardCount = allCardSets[setIndex].cards.length
          return sum + Math.round((stat.masteredCards * cardCount) / 100)
        }, 0)

        // 最長の学習ストリーク
        const maxStreak = Math.max(...allStats.map((stat) => stat.studyStreak), 0)

        // 最後の学習日
        const lastStudyDates = allStats.map((stat) => stat.lastStudyDate).filter(Boolean) as Date[]
        const lastStudyDate =
          lastStudyDates.length > 0 ? new Date(Math.max(...lastStudyDates.map((date) => date.getTime()))) : null

        setOverallStats({
          totalCards,
          masteredCards,
          studyStreak: maxStreak,
          lastStudyDate,
          totalSessions: completedSessions.length,
        })
      } catch (err) {
        console.error("Failed to calculate overall stats:", err)
        setError(err instanceof Error ? err.message : "統計情報の取得に失敗しました")
      } finally {
        setIsLoading(false)
      }
    }

    calculateOverallStats()
  }, [allCardSets])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>学習進捗</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40">
            <LoadingSpinner size={32} className="text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>学習進捗</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (!overallStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>学習進捗</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">まだ学習データがありません。</div>
        </CardContent>
      </Card>
    )
  }

  const masteredPercentage =
    overallStats.totalCards > 0 ? (overallStats.masteredCards / overallStats.totalCards) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>学習進捗</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* マスター進捗 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">マスター進捗</span>
            <span className="text-sm font-medium">{Math.round(masteredPercentage)}%</span>
          </div>
          <Progress value={masteredPercentage} className="h-2" />
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm font-medium">総カード数</div>
              <div className="text-xl font-bold">{overallStats.totalCards}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-green-500" />
            <div>
              <div className="text-sm font-medium">マスター済み</div>
              <div className="text-xl font-bold">{overallStats.masteredCards}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            <div>
              <div className="text-sm font-medium">学習ストリーク</div>
              <div className="text-xl font-bold">{overallStats.studyStreak}日</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <div>
              <div className="text-sm font-medium">学習セッション</div>
              <div className="text-xl font-bold">{overallStats.totalSessions}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
