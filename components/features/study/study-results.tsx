"use client"

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, SkipForward, Clock, Library, RefreshCw } from "lucide-react"

interface StudyResultsProps {
  results: {
    correct: number
    incorrect: number
    skipped: number
    totalTime: number
  }
  totalCards: number
  onBackToLibrary: () => void
  onRestartSession: () => void
}

export const StudyResults = ({ results, totalCards, onBackToLibrary, onRestartSession }: StudyResultsProps) => {
  const { correct, incorrect, skipped, totalTime } = results

  // 正解率の計算
  const answeredCards = correct + incorrect
  const correctRate = answeredCards > 0 ? (correct / answeredCards) * 100 : 0

  // 平均回答時間（秒）
  const averageTimePerCard = totalCards > 0 && totalTime > 0 ? Math.round(totalTime / totalCards / 1000) : 0

  // 合計時間（分と秒）
  const totalMinutes = Math.floor(totalTime / 60000)
  const totalSeconds = Math.floor((totalTime % 60000) / 1000)

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader className="bg-primary/5 border-b">
          <CardTitle className="text-center text-2xl">学習セッション完了</CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-8">
          {/* 結果サマリー */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-sm font-medium text-muted-foreground">正解</div>
              <div className="text-2xl font-bold">{correct}</div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
              <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <div className="text-sm font-medium text-muted-foreground">不正解</div>
              <div className="text-2xl font-bold">{incorrect}</div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-lg text-center">
              <SkipForward className="h-8 w-8 text-gray-500 mx-auto mb-2" />
              <div className="text-sm font-medium text-muted-foreground">スキップ</div>
              <div className="text-2xl font-bold">{skipped}</div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
              <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-sm font-medium text-muted-foreground">合計時間</div>
              <div className="text-2xl font-bold">
                {totalMinutes}:{totalSeconds.toString().padStart(2, "0")}
              </div>
            </div>
          </div>

          {/* 正解率 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">正解率</span>
              <span className="text-sm font-medium">{Math.round(correctRate)}%</span>
            </div>
            <Progress value={correctRate} className="h-2" />
          </div>

          {/* 追加統計 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">総カード数</div>
              <div className="text-xl font-bold">{totalCards}</div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">平均回答時間</div>
              <div className="text-xl font-bold">{averageTimePerCard}秒</div>
            </div>
          </div>

          {/* フィードバックメッセージ */}
          <div className="bg-primary/10 p-4 rounded-lg text-center">
            {correctRate >= 80 ? (
              <p className="font-medium">素晴らしい結果です！よく頑張りました！</p>
            ) : correctRate >= 60 ? (
              <p className="font-medium">良い結果です。さらに練習を続けましょう！</p>
            ) : (
              <p className="font-medium">もう少し練習が必要かもしれません。諦めずに続けましょう！</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-4 p-6 border-t bg-muted/30">
          <Button variant="outline" className="w-full sm:w-auto" onClick={onBackToLibrary}>
            <Library className="mr-2 h-5 w-5" />
            ライブラリに戻る
          </Button>
          <Button className="w-full sm:w-auto" onClick={onRestartSession}>
            <RefreshCw className="mr-2 h-5 w-5" />
            もう一度学習する
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
