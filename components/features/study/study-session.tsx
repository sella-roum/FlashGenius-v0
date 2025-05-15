"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/lib/store"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { StudyCard } from "@/components/features/study/study-card"
import { ChevronLeft, ChevronRight, Shuffle, CheckCircle, XCircle } from "lucide-react"
import { useStudyProgress } from "@/lib/hooks/use-study-progress"
import { useToast } from "@/hooks/use-toast"

export const StudySession = () => {
  const { toast } = useToast()
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date())
  const [cardStartTime, setCardStartTime] = useState<Date>(new Date())
  const [sessionId, setSessionId] = useState<string | null>(null)

  const {
    study: { activeCardSetIds, currentDeck, currentCardIndex, currentCard, isFrontVisible },
    nextCard,
    previousCard,
    shuffleDeck,
    flipCard,
  } = useStore()

  const cardSetId = activeCardSetIds[0] || ""
  const { startStudySession, completeStudySession, recordCardAnswer, currentSession } = useStudyProgress(cardSetId)

  // 学習セッション開始
  useEffect(() => {
    const initSession = async () => {
      try {
        const id = await startStudySession()
        setSessionId(id)
        setSessionStartTime(new Date())
        setCardStartTime(new Date())
      } catch (error) {
        toast({
          title: "エラー",
          description: "学習セッションの開始に失敗しました",
          variant: "destructive",
        })
      }
    }

    if (cardSetId && !sessionId) {
      initSession()
    }

    return () => {
      // コンポーネントのアンマウント時にセッションを終了
      if (sessionId && currentSession) {
        completeStudySession(sessionId, {
          cardsReviewed: currentSession.cardsReviewed,
          correctAnswers: currentSession.correctAnswers,
          incorrectAnswers: currentSession.incorrectAnswers,
          totalTimeSpent: currentSession.totalTimeSpent,
        }).catch(console.error)
      }
    }
  }, [cardSetId, sessionId, startStudySession, completeStudySession, currentSession, toast])

  // カードが変わったときに時間をリセット
  useEffect(() => {
    setCardStartTime(new Date())
  }, [currentCardIndex])

  // 進捗率の計算
  const progress = ((currentCardIndex + 1) / currentDeck.length) * 100

  // 正解/不正解の処理
  const handleAnswer = async (isCorrect: boolean) => {
    if (!currentCard) return

    const now = new Date()
    const timeSpent = now.getTime() - cardStartTime.getTime()

    try {
      await recordCardAnswer(currentCard, isCorrect, timeSpent)

      // 次のカードへ
      nextCard()

      // フィードバックを表示
      toast({
        title: isCorrect ? "正解" : "不正解",
        description: isCorrect ? "よくできました！" : "次回はがんばりましょう",
        variant: isCorrect ? "default" : "destructive",
      })
    } catch (error) {
      toast({
        title: "エラー",
        description: "回答の記録に失敗しました",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {currentCardIndex + 1} / {currentDeck.length}
        </div>
        <Button variant="outline" size="sm" onClick={shuffleDeck}>
          <Shuffle className="mr-2 h-4 w-4" />
          シャッフル
        </Button>
      </div>

      <Progress value={progress} className="h-2" />

      <Card className="p-6">
        <StudyCard />
      </Card>

      {!isFrontVisible && (
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            className="flex-1 border-red-500 hover:bg-red-500/10"
            onClick={() => handleAnswer(false)}
          >
            <XCircle className="mr-2 h-5 w-5 text-red-500" />
            不正解
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-green-500 hover:bg-green-500/10"
            onClick={() => handleAnswer(true)}
          >
            <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
            正解
          </Button>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={previousCard} disabled={currentDeck.length <= 1}>
          <ChevronLeft className="mr-2 h-5 w-5" />
          前へ
        </Button>

        <Button onClick={nextCard} disabled={currentDeck.length <= 1}>
          次へ
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
