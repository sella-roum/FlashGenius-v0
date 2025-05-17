import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URLが指定されていません" }, { status: 400 })
  }

  try {
    // Jina Reader APIを使用してコンテンツを取得
    const jinaReaderUrl = `https://r.jina.ai/${encodeURIComponent(url)}`

    console.log(`Jina Reader APIにリクエスト: ${jinaReaderUrl}`)

    const response = await fetch(jinaReaderUrl, {
      headers: {
        Accept: "text/plain",
        "User-Agent": "Mozilla/5.0 (compatible; FlashGenius/1.0; +https://flashgenius.app)",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Jina Reader APIエラー (${response.status}): ${errorText}`)
      throw new Error(`Jina Reader APIからのコンテンツ取得に失敗しました: ${response.status}`)
    }

    // Jina Readerはテキストとしてコンテンツを返す
    const content = await response.text()

    if (!content || content.trim() === "") {
      throw new Error("URLから有効なコンテンツを取得できませんでした")
    }

    console.log(`Jina Reader APIからコンテンツを取得: ${content.substring(0, 100)}...`)

    return NextResponse.json({ content })
  } catch (error) {
    console.error("URL取得エラー:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "不明なエラーが発生しました" },
      { status: 500 },
    )
  }
}
