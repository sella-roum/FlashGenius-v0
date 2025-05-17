"use client"

import { useState, useCallback } from "react"
import { useStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FileUp, LinkIcon, Type } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/constants"

export const InputArea = () => {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<string>("text")
  const [urlInput, setUrlInput] = useState<string>("")
  const [textInput, setTextInput] = useState<string>("")

  const { setInputType, setInputValue } = useStore()

  // ファイルドロップ処理
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      const file = acceptedFiles[0]

      // ファイルサイズチェック
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({
          title: "エラー",
          description: `ファイルサイズが大きすぎます。最大${MAX_FILE_SIZE_BYTES / 1024 / 1024}MBまでです。`,
          variant: "destructive",
        })
        return
      }

      try {
        // ファイルタイプに応じた処理
        if (file.type.startsWith("text/") || file.name.endsWith(".md")) {
          // テキストファイル
          const text = await file.text()
          setInputType("file")
          setInputValue(text)
          toast({
            title: "ファイル読み込み完了",
            description: `${file.name}を読み込みました。`,
          })
        } else if (file.type.startsWith("image/") || file.type === "application/pdf") {
          // 画像またはPDF
          const reader = new FileReader()
          reader.onload = () => {
            const dataUrl = reader.result as string
            setInputType("file")
            setInputValue(dataUrl)
            toast({
              title: "ファイル読み込み完了",
              description: `${file.name}を読み込みました。`,
            })
          }
          reader.readAsDataURL(file)
        } else {
          // サポート外のファイル
          toast({
            title: "警告",
            description: "サポートされていないファイル形式です。テキストとして処理を試みます。",
          })
          const text = await file.text()
          setInputType("file")
          setInputValue(text)
        }
      } catch (err) { // ESLint修正: error -> err, console.error追加
        console.error("File read error:", err);
        toast({
          title: "エラー",
          description: "ファイルの読み込みに失敗しました。",
          variant: "destructive",
        })
      }
    },
    [setInputType, setInputValue, toast],
  )

  // ドロップゾーン設定
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxFiles: 1,
  })

  // URL入力処理
  const handleUrlSubmit = () => {
    if (!urlInput) return

    // 簡易的なURL検証
    try {
      new URL(urlInput)
      setInputType("url")
      setInputValue(urlInput)
      toast({
        title: "URL設定完了",
        description: "URLが設定されました。",
      })
    } catch (err) { // ESLint修正: error -> err, console.error追加
      console.error("Invalid URL:", err);
      toast({
        title: "エラー",
        description: "有効なURLを入力してください。",
        variant: "destructive",
      })
    }
  }

  // テキスト入力処理
  const handleTextSubmit = () => {
    if (!textInput) return

    setInputType("text")
    setInputValue(textInput)
    toast({
      title: "テキスト設定完了",
      description: "テキストが設定されました。",
    })
  }

  return (
    <Card>
      <CardContent className="p-4">
        <Tabs defaultValue="text" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="file" className="flex items-center">
              <FileUp className="mr-2 h-4 w-4" />
              ファイル
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center">
              <LinkIcon className="mr-2 h-4 w-4" />
              URL
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center">
              <Type className="mr-2 h-4 w-4" />
              テキスト
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
                isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/20"
              }`}
            >
              <input {...getInputProps()} />
              <FileUp className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                ファイルをドラッグ＆ドロップするか、クリックして選択してください
              </p>
              <p className="text-xs text-muted-foreground mt-2">対応形式: TXT, MD, PDF, JPG, PNG, WEBP (最大10MB)</p>
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Input
                type="url"
                placeholder="https://example.com"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
              <Button onClick={handleUrlSubmit} className="w-full">
                URLを設定
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="テキストを入力してください..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={8}
              />
              <Button onClick={handleTextSubmit} className="w-full">
                テキストを設定
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
