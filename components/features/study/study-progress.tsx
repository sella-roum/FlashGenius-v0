"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/lib/store"
import { formatDate } from "@/lib/utils"
import { CheckCircle2, XCircle, Clock, Calendar, Award, Target } from "lucide-react"
import type { LearningStats } from "@/types"

interface StudyProgressProps {
  cardSetId: string
}

export const StudyProgress = ({ cardSetId }: StudyProgressProps) => {
  const { getCardSetStats } = useStore()
  const [stats, setStats] = useState<LearningStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const stats = await getCardSetStats(cardSetId)
        setStats(stats)
      } catch (err) {
        setError(err instanceof Error ? err.message : "統計情報の取得に失敗しました")
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [cardSetId, getCardSetStats])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>学習進捗</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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

  if (!stats) {
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
            <span className="text-sm font-medium">{Math.round(stats.masteredCards)}%</span>
          </div>
          <Progress value={stats.masteredCards} className="h-2" />
        </div>

        {/* 正解率 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">正解率</span>
            <span className="text-sm font-medium">{Math.round(stats.accuracy)}%</span>
          </div>
          <Progress value={stats.accuracy} className="h-2" />
        </div>

        {/* 学習統計 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div>
              <div className="text-sm font-medium">正解</div>
              <div className="text-xl font-bold">{stats.correctReviews}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <div>
              <div className="text-sm font-medium">不正解</div>
              <div className="text-xl font-bold">{stats.incorrectReviews}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <div>
              <div className="text-sm font-medium">平均時間</div>
              <div className="text-xl font-bold">{Math.round(stats.averageTimePerCard / 1000)}秒</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-500" />
            <div>
              <div className="text-sm font-medium">学習セッション</div>
              <div className="text-xl font-bold">{stats.studySessionsCompleted}</div>
            </div>
          </div>
        </div>

        {/* 学習ストリーク */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            <div className="text-sm font-medium">学習ストリーク</div>
          </div>
          <Badge variant="outline" className="text-lg font-bold px-3 py-1">
            {stats.studyStreak}日
          </Badge>
        </div>

        {/* 日次目標 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <div className="text-sm font-medium">今日の目標</div>
          </div>
          <Badge variant={stats.dailyGoalMet ? "success" : "outline"} className="px-3 py-1">
            {stats.dailyGoalMet ? "達成" : "未達成"}
          </Badge>
        </div>

        {/* 最終学習日 */}
        {stats.lastStudyDate && (
          <div className="text-sm text-muted-foreground">最終学習日: {formatDate(stats.lastStudyDate)}</div>
        )}
      </CardContent>
    </Card>
  )
}
