"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { HelpCircle, Info, RefreshCw, CheckCircle, XCircle, SkipForward } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"

interface StudyCardProps {
  onCorrect: () => void
  onIncorrect: () => void
  onSkip: () => void
}

export const StudyCard = ({ onCorrect, onIncorrect, onSkip }: StudyCardProps) => {
  const [activeTab, setActiveTab] = useState<string>("card")

  const {
    study: { currentCard, isFrontVisible, currentHint, isHintLoading, currentDetails, isDetailsLoading },
    flipCard,
    fetchHint,
    hideHint,
    fetchDetails,
    hideDetails,
  } = useStore()

  if (!currentCard) {
    return <div>カードが見つかりません</div>
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="card">カード</TabsTrigger>
          <TabsTrigger value="hint">ヒント</TabsTrigger>
          <TabsTrigger value="details">詳細説明</TabsTrigger>
        </TabsList>

        <TabsContent value="card" className="space-y-6">
          <div
            className={cn(
              "min-h-[200px] p-6 rounded-lg flex items-center justify-center text-center transition-colors",
              isFrontVisible ? "bg-primary/10" : "bg-secondary/50",
            )}
          >
            <div className="max-w-md">
              {isFrontVisible ? (
                <div className="text-xl font-medium">{currentCard.front}</div>
              ) : (
                <div className="text-xl">{currentCard.back}</div>
              )}
            </div>
          </div>

          {isFrontVisible ? (
            <Button onClick={flipCard} className="w-full" variant="outline" size="lg">
              答えを表示
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={onIncorrect}
                  variant="outline"
                  className="bg-red-50 hover:bg-red-100 border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:border-red-800"
                >
                  <XCircle className="mr-2 h-5 w-5 text-red-500" />
                  不正解
                </Button>
                <Button
                  onClick={onSkip}
                  variant="outline"
                  className="bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/40 dark:hover:bg-gray-800/60"
                >
                  <SkipForward className="mr-2 h-5 w-5" />
                  スキップ
                </Button>
                <Button
                  onClick={onCorrect}
                  variant="outline"
                  className="bg-green-50 hover:bg-green-100 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:border-green-800"
                >
                  <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                  正解
                </Button>
              </div>
              <Button onClick={flipCard} variant="ghost" className="w-full">
                質問に戻る
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="hint" className="min-h-[300px]">
          {currentHint ? (
            <div className="space-y-4">
              <div className="p-6 bg-secondary/20 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">ヒント</h3>
                </div>
                <p>{currentHint}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={hideHint} className="flex-1">
                  閉じる
                </Button>
                <Button variant="outline" onClick={fetchHint} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  再生成
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px]">
              {isHintLoading ? (
                <div className="text-center">
                  <LoadingSpinner className="mx-auto mb-4" />
                  <p className="text-muted-foreground">ヒントを生成中...</p>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">答えを直接教えないヒントを生成します。</p>
                  <Button onClick={fetchHint}>
                    <HelpCircle className="mr-2 h-5 w-5" />
                    ヒントを表示
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="details" className="min-h-[300px]">
          {currentDetails ? (
            <div className="space-y-4">
              <div className="p-6 bg-secondary/20 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">詳細説明</h3>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{currentDetails}</ReactMarkdown>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={hideDetails} className="flex-1">
                  閉じる
                </Button>
                <Button variant="outline" onClick={fetchDetails} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  再生成
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px]">
              {isDetailsLoading ? (
                <div className="text-center">
                  <LoadingSpinner className="mx-auto mb-4" />
                  <p className="text-muted-foreground">詳細説明を生成中...</p>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">答えを直接教えない詳細な説明を生成します。</p>
                  <Button onClick={fetchDetails}>
                    <Info className="mr-2 h-5 w-5" />
                    詳細説明を表示
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
