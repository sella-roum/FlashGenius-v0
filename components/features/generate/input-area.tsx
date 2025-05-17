"use client"

import { useState, useCallback, useEffect } from "react"
import { useStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileUp, LinkIcon, Type, Check } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/constants"

export const InputArea = () => {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<string>("text")
  const [urlInput, setUrlInput] = useState<string>("")
  const [textInput, setTextInput] = useState<string>("")
  const [fileName, setFileName] = useState<string | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)

  const {
    generate: { inputType, inputValue },
    setInputType,
    setInputValue,
  } = useStore()

  // 初期化時に適切なタブを選択
  useEffect(() => {
    if (inputType) {
      setActiveTab(inputType)
    }
  }, [inputType])

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
        setFileName(file.name)

        // ファイルタイプに応じた処理
        if (file.type.startsWith("text/") || file.name.endsWith(".md")) {
          // テキストファイル
          const text = await file.text()
          setInputType("file")
          setInputValue(text)
          setFilePreview(text.substring(0, 200) + (text.length > 200 ? "..." : ""))
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

            if (file.type.startsWith("image/")) {
              setFilePreview("画像ファイル")
            } else {
              setFilePreview("PDFファイル")
            }

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
          setFilePreview(text.substring(0, 200) + (text.length > 200 ? "..." : ""))
        }
      } catch (err) {
        console.error("File read error:", err)
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
    } catch (err) {
      console.error("Invalid URL:", err)
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

  // 入力状態のリセット
  const handleReset = () => {
    setInputType(null)
    setInputValue("")
    setFileName(null)
    setFilePreview(null)
    setUrlInput("")
    setTextInput("")
    toast({
      title: "リセット完了",
      description: "入力内容をリセットしました。",
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
              <p className="text-xs text-muted-foreground mt-2">
                URLを入力すると、Jina Reader APIを使用してコンテンツを取得します。
                HTML、PDF、その他の形式に対応しています。
              </p>
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

      {inputType && inputValue && (
        <CardFooter className="border-t p-4 bg-muted/50">
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10">
                  {inputType === "file" ? "ファイル" : inputType === "url" ? "URL" : "テキスト"}
                </Badge>
                {fileName && <span className="text-sm font-medium">{fileName}</span>}
                {inputType === "url" && <span className="text-sm font-medium">{inputValue}</span>}
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 px-2">
                リセット
              </Button>
            </div>

            {inputType === "file" && filePreview && (
              <div className="text-sm text-muted-foreground border rounded-md p-2 max-h-24 overflow-y-auto">
                {filePreview}
              </div>
            )}

            {inputType === "text" && (
              <div className="text-sm text-muted-foreground border rounded-md p-2 max-h-24 overflow-y-auto">
                {inputValue.length > 200 ? inputValue.substring(0, 200) + "..." : inputValue}
              </div>
            )}

            <div className="flex items-center text-sm text-green-600">
              <Check className="h-4 w-4 mr-1" />
              入力内容が設定されました
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
