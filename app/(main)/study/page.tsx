"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { useIndexedDB } from "@/lib/hooks/use-indexed-db"
import { PageTitle } from "@/components/shared/page-title"
import { StudySession } from "@/components/features/study/study-session"
import { StudyResults } from "@/components/features/study/study-results"
import { FullPageLoading } from "@/components/shared/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function StudyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sessionCompleted, setSessionCompleted] = useState(false)
  const [sessionResults, setSessionResults] = useState<{
    correct: number
    incorrect: number
    skipped: number
    totalTime: number
  } | null>(null)

  // ESLint修正: setIds の初期化を useMemo でラップ
  const setIds = useMemo(() => {
    return searchParams.get("setIds")?.split(",") || []
  }, [searchParams])

  const { getCardSetById } = useIndexedDB()
  const {
    startStudySession,
    resetStudySession,
    finishStudySession,
    study: { activeCardSetIds, currentDeck, error, sessionCardResults },
  } = useStore()

  // 学習セッションの初期化
  useEffect(() => {
    const initStudySession = async () => {
      if (setIds.length === 0) {
        return
      }

      try {
        // カードセットの取得
        const cardSetPromises = setIds.map((id) => getCardSetById(id))
        const cardSets = await Promise.all(cardSetPromises)

        // 無効なIDを除外
        const validCardSets = cardSets.filter(Boolean)

        if (validCardSets.length === 0) {
          throw new Error("指定されたカードセットが見つかりませんでした")
        }

        // すべてのカードを結合
        const allCards = validCardSets.flatMap((set) => set!.cards)

        // 学習セッション開始
        startStudySession(
          validCardSets.map((set) => set!.id),
          allCards,
        )
      } catch (error) {
        console.error("学習セッション初期化エラー:", error)
      }
    }

    if (!sessionCompleted) {
      initStudySession()
    }

    // クリーンアップ
    return () => {
      if (!sessionCompleted) {
        resetStudySession()
      }
    }
  }, [setIds, getCardSetById, startStudySession, resetStudySession, sessionCompleted])

  // セッション完了時の処理
  const handleSessionComplete = async () => {
    try {
      // 結果の集計
      const correct = sessionCardResults.filter((r) => r.result === "correct").length
      const incorrect = sessionCardResults.filter((r) => r.result === "incorrect").length
      const skipped = sessionCardResults.filter((r) => r.result === "skipped").length
      const totalTime = sessionCardResults.reduce((sum, r) => sum + r.timeSpent, 0)

      // 結果を保存
      setSessionResults({
        correct,
        incorrect,
        skipped,
        totalTime,
      })

      // セッションを完了としてマーク
      setSessionCompleted(true)

      // データベースに保存
      await finishStudySession()
    } catch (error) {
      console.error("セッション完了処理エラー:", error)
    }
  }

  // ライブラリに戻る
  const handleBackToLibrary = () => {
    router.push("/library")
  }

  // 同じセットで再学習
  const handleRestartSession = () => {
    setSessionCompleted(false)
    setSessionResults(null)
    resetStudySession()
  }

  // セットIDがない場合
  if (setIds.length === 0) {
    return (
      <div className="space-y-6">
        <PageTitle title="学習セッション" subtitle="カードセットを選択して学習を始めましょう。" />

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            カードセットが選択されていません。ライブラリから学習したいセットを選択してください。
          </AlertDescription>
        </Alert>

        <Button onClick={() => router.push("/library")}>ライブラリに戻る</Button>
      </div>
    )
  }

  // 読み込み中
  if (!sessionCompleted && (activeCardSetIds.length === 0 || currentDeck.length === 0)) {
    return <FullPageLoading message="学習セッションを準備中..." />
  }

  // エラー
  if (error) {
    return (
      <div className="space-y-6">
        <PageTitle title="学習セッション" subtitle="エラーが発生しました。" />

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <Button onClick={() => router.push("/library")}>ライブラリに戻る</Button>
      </div>
    )
  }

  // セッション完了後の結果表示
  if (sessionCompleted && sessionResults) {
    return (
      <div className="space-y-6">
        <PageTitle title="学習セッション完了" subtitle="お疲れ様でした！学習結果を確認しましょう。" />

        <StudyResults
          results={sessionResults}
          totalCards={currentDeck.length}
          onBackToLibrary={handleBackToLibrary}
          onRestartSession={handleRestartSession}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageTitle title="学習セッション" subtitle="カードを学習し、知識を定着させましょう。" />

      <StudySession onComplete={handleSessionComplete} />
    </div>
  )
}
