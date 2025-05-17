"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/lib/store"
import { useIndexedDB } from "@/lib/hooks/use-indexed-db"
import { PageTitle } from "@/components/shared/page-title"
import { FullPageLoading } from "@/components/shared/loading-spinner"
import { StudyHistoryList } from "@/components/features/history/study-history-list"
import { StudyHistoryChart } from "@/components/features/history/study-history-chart"
import { StudyHistoryCalendar } from "@/components/features/history/study-history-calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function HistoryPage() {
  const { allCardSets } = useIndexedDB()
  const { setAllCardSets } = useStore()
  const [isLoading, setIsLoading] = useState(true)
  const [studySessions, setStudySessions] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (allCardSets) {
      setAllCardSets(allCardSets)
    }
  }, [allCardSets, setAllCardSets])

  useEffect(() => {
    const loadStudySessions = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // 動的インポート
        const indexedDB = await import("@/lib/indexed-db")
        const sessions = await indexedDB.getAllStudySessions()

        // 完了したセッションのみを対象とし、日付順にソート
        const completedSessions = sessions
          .filter((session) => session.completedAt !== null)
          .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())

        // カードセット情報を付加
        const sessionsWithDetails = await Promise.all(
          completedSessions.map(async (session) => {
            try {
              const cardSet = await indexedDB.getCardSetById(session.cardSetId)
              return {
                ...session,
                cardSetName: cardSet?.name || "不明なセット",
                cardSetTheme: cardSet?.theme || "不明",
                accuracy: session.cardsReviewed > 0 ? (session.correctAnswers / session.cardsReviewed) * 100 : 0,
              }
            } catch (err) {
              console.error(`Failed to get card set details for session ${session.id}:`, err)
              return {
                ...session,
                cardSetName: "不明なセット",
                cardSetTheme: "不明",
                accuracy: session.cardsReviewed > 0 ? (session.correctAnswers / session.cardsReviewed) * 100 : 0,
              }
            }
          }),
        )

        setStudySessions(sessionsWithDetails)
      } catch (err) {
        console.error("Failed to load study sessions:", err)
        setError(err instanceof Error ? err.message : "学習履歴の取得に失敗しました")
      } finally {
        setIsLoading(false)
      }
    }

    loadStudySessions()
  }, [])

  if (isLoading) {
    return <FullPageLoading message="学習履歴を読み込み中..." />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageTitle title="学習履歴" subtitle="過去の学習セッションの記録を確認できます。" />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (studySessions.length === 0) {
    return (
      <div className="space-y-6">
        <PageTitle title="学習履歴" subtitle="過去の学習セッションの記録を確認できます。" />
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">まだ学習履歴がありません。カードセットを学習してみましょう。</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageTitle title="学習履歴" subtitle="過去の学習セッションの記録を確認できます。" />

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full md:w-auto">
          <TabsTrigger value="list">リスト</TabsTrigger>
          <TabsTrigger value="chart">グラフ</TabsTrigger>
          <TabsTrigger value="calendar">カレンダー</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <StudyHistoryList sessions={studySessions} />
        </TabsContent>

        <TabsContent value="chart" className="space-y-6">
          <StudyHistoryChart sessions={studySessions} />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <StudyHistoryCalendar sessions={studySessions} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
