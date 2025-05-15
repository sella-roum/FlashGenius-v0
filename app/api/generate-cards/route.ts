import { type NextRequest, NextResponse } from "next/server"
import { generateFlashcards } from "@/lib/ai/gemini"
import { MAX_INPUT_CHAR_LENGTH_FOR_FLOW } from "@/lib/constants"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { inputType, inputValue, generationOptions } = body

    if (!inputType || !inputValue) {
      return NextResponse.json({ error: "入力内容が不足しています" }, { status: 400 })
    }

    // 入力が長すぎる場合は切り詰める
    let content = inputValue
    if (typeof content === "string" && content.length > MAX_INPUT_CHAR_LENGTH_FOR_FLOW) {
      content = content.substring(0, MAX_INPUT_CHAR_LENGTH_FOR_FLOW)
    }

    console.log("カード生成開始:", {
      inputType,
      contentLength: content.length,
      cardType: generationOptions.cardType,
      language: generationOptions.language,
    })

    try {
      const cards = await generateFlashcards(
        content,
        generationOptions.cardType,
        generationOptions.language,
        generationOptions.additionalPrompt,
      )

      console.log("カード生成成功:", cards.length + "枚")
      return NextResponse.json({ cards })
    } catch (aiError) {
      console.error("AI処理エラー:", aiError)
      return NextResponse.json(
        { error: aiError instanceof Error ? aiError.message : "AIによるカード生成中にエラーが発生しました" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("カード生成エラー:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "不明なエラーが発生しました" },
      { status: 500 },
    )
  }
}
