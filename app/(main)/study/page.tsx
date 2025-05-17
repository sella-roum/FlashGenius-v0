"use client"

import { useEffect, useMemo } from "react" // ESLint修正: useMemo をインポート
import { useSearchParams, useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { useIndexedDB } from "@/lib/hooks/use-indexed-db"
import { PageTitle } from "@/components/shared/page-title"
import { StudySession } from "@/components/features/study/study-session"
import { FullPageLoading } from "@/components/shared/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function StudyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // ESLint修正: setIds の初期化を useMemo でラップ
  const setIds = useMemo(() => {
    return searchParams.get("setIds")?.split(",") || []
  }, [searchParams])

  const { getCardSetById } = useIndexedDB()
  const {
    startStudySession,
    resetStudySession,
    study: { activeCardSetIds, currentDeck, error },
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

    initStudySession()

    // クリーンアップ
    return () => {
      resetStudySession()
    }
  }, [setIds, getCardSetById, startStudySession, resetStudySession])

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
  if (activeCardSetIds.length === 0 || currentDeck.length === 0) {
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

  return (
    <div className="space-y-6">
      <PageTitle title="学習セッション" subtitle="カードを学習し、知識を定着させましょう。" />

      <StudySession />
    </div>
  )
}
