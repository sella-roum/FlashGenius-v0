import { type NextRequest, NextResponse } from "next/server"
import { generateHint } from "@/lib/ai/gemini"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { front, back } = body

    if (!front || !back) {
      return NextResponse.json({ error: "カードの表面と裏面の両方が必要です" }, { status: 400 })
    }

    const hint = await generateHint(front, back)

    return NextResponse.json({ hint })
  } catch (error) {
    console.error("ヒント生成エラー:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "不明なエラーが発生しました" },
      { status: 500 },
    )
  }
}
