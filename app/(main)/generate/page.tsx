"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { useIndexedDB } from "@/lib/hooks/use-indexed-db"
import { useToast } from "@/hooks/use-toast"
import { PageTitle } from "@/components/shared/page-title"
import { InputArea } from "@/components/features/generate/input-area"
import { GenerationOptions } from "@/components/features/generate/generation-options"
import { PreviewAndSave } from "@/components/features/generate/preview-and-save"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function GeneratePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { addCardSet, allTags } = useIndexedDB()

  const {
    generate: {
      inputType,
      inputValue,
      // generationOptions, // ESLint修正: 未使用のため削除
      previewCards,
      isLoading,
      error,
      warningMessage,
      cardSetName,
      cardSetTheme,
      cardSetTags,
    },
    generatePreview,
    resetGenerator,
  } = useStore()

  // 生成ページを離れるときにリセット
  useEffect(() => {
    return () => {
      resetGenerator()
    }
  }, [resetGenerator])

  // カードセットを保存
  const handleSave = async () => {
    if (previewCards.length === 0) {
      toast({
        title: "エラー",
        description: "カードが生成されていません。",
        variant: "destructive",
      })
      return
    }

    if (!cardSetName) {
      toast({
        title: "エラー",
        description: "セット名を入力してください。",
        variant: "destructive",
      })
      return
    }

    try {
      await addCardSet({
        name: cardSetName,
        theme: cardSetTheme,
        tags: cardSetTags,
        cards: previewCards,
        sourceType: inputType || undefined,
        sourceValue: inputValue,
        // TypeScriptエラー(ts2345)修正: 不足していたプロパティを追加
        totalCards: previewCards.length,
        masteredCards: 0,
        learningCards: 0,
        newCards: previewCards.length,
        studySessionCount: 0,
      })

      toast({
        title: "保存完了",
        description: "カードセットが保存されました。",
      })

      // 保存後にライブラリページに遷移
      router.push("/library")
    } catch (error) {
      toast({
        title: "保存エラー",
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="フラッシュカード生成"
        subtitle="テキスト、URL、またはファイルからAIを使ってフラッシュカードを生成します。"
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {warningMessage && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{warningMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <InputArea />
          <GenerationOptions />
          <Button onClick={generatePreview} disabled={isLoading || !inputType || !inputValue} className="w-full">
            {isLoading ? "カード生成中..." : "プレビュー生成"}
          </Button>
        </div>

        <div className="md:col-span-2">
          <PreviewAndSave onSave={handleSave} availableTags={allTags?.map((tag) => tag.name) || []} />
        </div>
      </div>
    </div>
  )
}
