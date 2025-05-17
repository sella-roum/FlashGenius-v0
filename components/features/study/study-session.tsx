"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/lib/store"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { StudyCard } from "@/components/features/study/study-card"
import { ChevronLeft, ChevronRight, Shuffle, Flag } from "lucide-react"
import { useStudyProgress } from "@/lib/hooks/use-study-progress"
import { useToast } from "@/hooks/use-toast"

interface StudySessionProps {
  onComplete: () => void
}

export const StudySession = ({ onComplete }: StudySessionProps) => {
  const { toast } = useToast()
  const [cardStartTime, setCardStartTime] = useState<Date>(new Date())
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLastCard, setIsLastCard] = useState(false)

  const {
    study: { activeCardSetIds, currentDeck, currentCardIndex, currentCard, isFrontVisible, sessionCardResults },
    nextCard,
    previousCard,
    shuffleDeck,
  } = useStore()

  const cardSetId = activeCardSetIds[0] || ""
  const { startStudySession, completeStudySession, recordCardAnswer, currentSession } = useStudyProgress(cardSetId)

  // 学習セッション開始
  useEffect(() => {
    const initSession = async () => {
      try {
        const id = await startStudySession()
        setSessionId(id)
        setCardStartTime(new Date())
      } catch (err) {
        console.error("Failed to initialize study session:", err)
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
      if (sessionId && currentSession && sessionCardResults.length > 0) {
        completeStudySession(sessionId, {
          cardsReviewed: currentSession.cardsReviewed,
          correctAnswers: currentSession.correctAnswers,
          incorrectAnswers: currentSession.incorrectAnswers,
          totalTimeSpent: currentSession.totalTimeSpent,
        }).catch(console.error)
      }
    }
  }, [cardSetId, sessionId, startStudySession, completeStudySession, currentSession, toast, sessionCardResults])

  // カードが変わったときに時間をリセット
  useEffect(() => {
    setCardStartTime(new Date())

    // 最後のカードかどうかをチェック
    setIsLastCard(currentCardIndex === currentDeck.length - 1)
  }, [currentCardIndex, currentDeck.length])

  // 進捗率の計算
  const progress = ((currentCardIndex + 1) / currentDeck.length) * 100

  // 正解/不正解の処理
  const handleAnswer = async (isCorrect: boolean) => {
    if (!currentCard) return

    const now = new Date()
    const timeSpent = now.getTime() - cardStartTime.getTime()

    try {
      await recordCardAnswer(currentCard, isCorrect, timeSpent)

      // フィードバックを表示
      toast({
        title: isCorrect ? "正解" : "不正解",
        description: isCorrect ? "よくできました！" : "次回はがんばりましょう",
        variant: isCorrect ? "default" : "destructive",
      })

      // 最後のカードの場合はセッション完了
      if (isLastCard) {
        onComplete()
      } else {
        // 次のカードへ
        nextCard()
      }
    } catch (err) {
      console.error("Failed to record answer:", err)
      toast({
        title: "エラー",
        description: "回答の記録に失敗しました",
        variant: "destructive",
      })
    }
  }

  // スキップの処理
  const handleSkip = async () => {
    if (!currentCard) return

    const now = new Date()
    const timeSpent = now.getTime() - cardStartTime.getTime()

    try {
      // スキップとして記録
      await recordCardAnswer(currentCard, false, timeSpent)

      // 最後のカードの場合はセッション完了
      if (isLastCard) {
        onComplete()
      } else {
        // 次のカードへ
        nextCard()
      }
    } catch (err) {
      console.error("Failed to record skip:", err)
      toast({
        title: "エラー",
        description: "スキップの記録に失敗しました",
        variant: "destructive",
      })
    }
  }

  // セッション完了
  const handleCompleteSession = () => {
    onComplete()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {currentCardIndex + 1} / {currentDeck.length}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={shuffleDeck}>
            <Shuffle className="mr-2 h-4 w-4" />
            シャッフル
          </Button>
          <Button variant="outline" size="sm" onClick={handleCompleteSession}>
            <Flag className="mr-2 h-4 w-4" />
            終了
          </Button>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <Card className="p-6">
        <StudyCard onCorrect={() => handleAnswer(true)} onIncorrect={() => handleAnswer(false)} onSkip={handleSkip} />
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={previousCard} disabled={currentDeck.length <= 1 || currentCardIndex === 0}>
          <ChevronLeft className="mr-2 h-5 w-5" />
          前へ
        </Button>

        <Button onClick={isLastCard ? handleCompleteSession : nextCard} disabled={currentDeck.length <= 1}>
          {isLastCard ? "完了" : "次へ"}
          {!isLastCard && <ChevronRight className="ml-2 h-5 w-5" />}
        </Button>
      </div>
    </div>
  )
}
