"use client"

import { useStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"
import { CARD_TYPE_OPTIONS, LANGUAGE_OPTIONS } from "@/lib/constants"

export const GenerationOptions = () => {
  const {
    generate: { generationOptions, inputType, inputValue },
    setGenerationOptions,
  } = useStore()

  // 入力内容のプレビュー（最初の100文字）
  const inputPreview =
    inputValue && typeof inputValue === "string"
      ? inputValue.length > 100
        ? inputValue.substring(0, 100) + "..."
        : inputValue
      : ""

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>生成オプション</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 現在の入力内容 */}
        {inputType && inputValue && (
          <Alert className="bg-primary/5 border-primary/20">
            <InfoIcon className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              <span className="font-medium">現在の入力: </span>
              {inputType === "text" && "直接入力されたテキスト"}
              {inputType === "url" && <span className="text-blue-500 underline">{inputValue}</span>}
              {inputType === "file" && "アップロードされたファイル"}
              {inputType === "text" && <div className="mt-1 text-muted-foreground text-xs">{inputPreview}</div>}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>カードタイプ</Label>
          <RadioGroup
            value={generationOptions.cardType}
            onValueChange={(value) =>
              setGenerationOptions({ cardType: value as "term-definition" | "qa" | "image-description" })
            }
            className="flex flex-col space-y-1"
          >
            {CARD_TYPE_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`card-type-${option.value}`} />
                <Label htmlFor={`card-type-${option.value}`} className="cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">言語</Label>
          <Select
            value={generationOptions.language}
            onValueChange={(value) => setGenerationOptions({ language: value })}
          >
            <SelectTrigger id="language">
              <SelectValue placeholder="言語を選択" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="additional-prompt">追加指示（オプション）</Label>
          <Textarea
            id="additional-prompt"
            placeholder="AIへの追加指示があれば入力してください..."
            value={generationOptions.additionalPrompt || ""}
            onChange={(e) => setGenerationOptions({ additionalPrompt: e.target.value })}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  )
}
