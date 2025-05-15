import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URLが指定されていません" }, { status: 400 })
  }

  try {
    // 直接URLからコンテンツを取得する方法に変更
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FlashGenius/1.0; +https://flashgenius.app)",
      },
    })

    if (!response.ok) {
      throw new Error(`URLからのコンテンツ取得に失敗しました: ${response.status}`)
    }

    // レスポンスのContent-Typeをチェック
    const contentType = response.headers.get("Content-Type") || ""

    let content = ""

    if (contentType.includes("application/json")) {
      // JSONの場合
      const data = await response.json()
      content = JSON.stringify(data)
    } else if (contentType.includes("text/html")) {
      // HTMLの場合、シンプルなテキスト抽出を行う
      const html = await response.text()
      content = extractTextFromHTML(html)
    } else {
      // その他のテキスト形式
      content = await response.text()
    }

    return NextResponse.json({ content })
  } catch (error) {
    console.error("URL取得エラー:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "不明なエラーが発生しました" },
      { status: 500 },
    )
  }
}

// HTMLからテキストを抽出する簡易関数
function extractTextFromHTML(html: string): string {
  // スクリプトタグを削除
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")

  // スタイルタグを削除
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")

  // HTMLタグを削除
  text = text.replace(/<[^>]*>/g, " ")

  // 連続する空白を1つに置換
  text = text.replace(/\s+/g, " ")

  // 特殊文字をデコード
  text = text.replace(/&nbsp;/g, " ")
  text = text.replace(/&amp;/g, "&")
  text = text.replace(/&lt;/g, "<")
  text = text.replace(/&gt;/g, ">")
  text = text.replace(/&quot;/g, '"')

  return text.trim()
}
