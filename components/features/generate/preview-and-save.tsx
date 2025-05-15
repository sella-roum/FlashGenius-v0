"use client"

import { useStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TagInput } from "@/components/shared/tag-input"
import { GeneratedCard } from "@/components/features/generate/generated-card"
import { THEME_OPTIONS } from "@/lib/constants"
import { FullPageLoading } from "@/components/shared/loading-spinner"
import { PlusCircle } from "lucide-react"

interface PreviewAndSaveProps {
  onSave: () => void
  availableTags: string[]
}

export const PreviewAndSave = ({ onSave, availableTags }: PreviewAndSaveProps) => {
  const {
    generate: { previewCards, isLoading, cardSetName, cardSetTheme, cardSetTags },
    setCardSetName,
    setCardSetTheme,
    setCardSetTags,
    updatePreviewCard,
    deletePreviewCard,
    addPreviewCard,
  } = useStore()

  const handleAddEmptyCard = () => {
    addPreviewCard({
      front: "",
      back: "",
    })
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle>プレビュー＆保存</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <FullPageLoading message="カードを生成中..." />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="card-set-name">セット名</Label>
                <Input
                  id="card-set-name"
                  placeholder="セット名を入力"
                  value={cardSetName}
                  onChange={(e) => setCardSetName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="card-set-theme">テーマ</Label>
                <Select value={cardSetTheme} onValueChange={setCardSetTheme}>
                  <SelectTrigger id="card-set-theme">
                    <SelectValue placeholder="テーマを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {THEME_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>タグ</Label>
              <TagInput
                value={cardSetTags}
                onChange={setCardSetTags}
                suggestions={availableTags}
                placeholder="タグを追加..."
              />
            </div>

            {previewCards.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-medium">生成されたカード ({previewCards.length}枚)</h3>
                <div className="space-y-4">
                  {previewCards.map((card, index) => (
                    <GeneratedCard
                      key={card.id}
                      card={card}
                      index={index}
                      onUpdate={(updates) => updatePreviewCard(index, updates)}
                      onDelete={() => deletePreviewCard(index)}
                    />
                  ))}
                </div>

                <Button variant="outline" className="w-full" onClick={handleAddEmptyCard}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  空のカードを追加
                </Button>

                <Button className="w-full" onClick={onSave} disabled={previewCards.length === 0 || !cardSetName}>
                  カードセットを保存
                </Button>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  カードがまだ生成されていません。入力内容を設定し、「プレビュー生成」ボタンをクリックしてください。
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
