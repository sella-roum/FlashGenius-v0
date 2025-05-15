import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/genai"

// APIキーの取得
const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY

// Google AI SDKの初期化
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

// モデルの設定
const modelName = "gemini-1.5-pro"

// 安全性設定
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
]

// フラッシュカード生成用のプロンプト
export const generateFlashcardsPrompt = (
  content: string,
  cardType: string,
  language: string,
  additionalPrompt?: string,
) => {
  const basePrompt = `
あなたは教育コンテンツの専門家です。以下の内容から効果的なフラッシュカードを作成してください。

## 指示
- 提供された内容から重要な概念、用語、事実を抽出し、フラッシュカードを作成してください。
- 各カードは「表面」と「裏面」の情報を持ちます。
- 内容が長い場合は、最も重要で学習価値の高い情報を優先してください。
- 10〜20枚程度のカードを作成してください（内容の量に応じて調整）。
- 各カードは独立していて、それ自体で完結している必要があります。
- 明確で簡潔な表現を使用してください。
- 参照や引用がある場合は、それらを適切に処理してください。

## カード形式
`

  let formatPrompt = ""

  switch (cardType) {
    case "term-definition":
      formatPrompt = `
- 表面: 重要な用語、概念、または名前
- 裏面: その用語の定義、説明、または重要性
`
      break
    case "qa":
      formatPrompt = `
- 表面: 質問形式で内容を問う
- 裏面: 質問に対する回答
`
      break
    case "image-description":
      formatPrompt = `
- 表面: 画像に関する説明や質問（画像がある場合）
- 裏面: 説明の詳細または質問の回答
`
      break
    default:
      formatPrompt = `
- 表面: 重要な用語、概念、または名前
- 裏面: その用語の定義、説明、または重要性
`
  }

  let languagePrompt = ""

  switch (language) {
    case "japanese":
      languagePrompt = "- すべてのカードは日本語で作成してください。"
      break
    case "english":
      languagePrompt = "- すべてのカードは英語で作成してください。"
      break
    case "mixed":
      languagePrompt = "- 元の内容の言語に合わせてカードを作成してください。"
      break
    default:
      languagePrompt = "- 元の内容の言語に合わせてカードを作成してください。"
  }

  const additionalInstructions = additionalPrompt ? `\n## 追加指示\n${additionalPrompt}` : ""

  const outputFormatPrompt = `
## 出力形式
以下のJSON形式で出力してください：

{
  "cards": [
    {
      "front": "カードの表面のテキスト",
      "back": "カードの裏面のテキスト"
    },
    ...
  ]
}

他の説明や前置きは不要です。JSONのみを出力してください。
`

  const fullPrompt = `${basePrompt}${formatPrompt}\n${languagePrompt}${additionalInstructions}\n\n## 内容\n${content}\n${outputFormatPrompt}`

  return fullPrompt
}

// ヒント生成用のプロンプト
export const generateHintPrompt = (front: string, back: string) => {
  return `
あなたは教育支援AIです。以下のフラッシュカードの内容に基づいて、学習者向けのヒントを作成してください。

## フラッシュカード
表面: ${front}
裏面: ${back}

## 指示
- 裏面の答えを直接教えないようなヒントを作成してください。
- ヒントは学習者が自分で答えを思い出すのを助ける程度の情報を含むべきです。
- 簡潔で明確なヒントを作成してください。
- 1〜3文程度の長さにしてください。

ヒントのみを出力してください。前置きや説明は不要です。
`
}

// 詳細説明生成用のプロンプト
export const generateDetailsPrompt = (front: string, back: string) => {
  return `
あなたは教育コンテンツの専門家です。以下のフラッシュカードの内容に基づいて、詳細な説明を作成してください。

## フラッシュカード
表面: ${front}
裏面: ${back}

## 指示
- このトピックについての詳細な説明を提供してください。
- 背景情報、例、関連する概念、実際の応用例などを含めてください。
- 学習者がこの概念をより深く理解できるような情報を提供してください。
- Markdown形式で出力してください。見出し、箇条書き、強調などを適切に使用してください。
- 300〜500単語程度の説明を作成してください。

詳細説明のみを出力してください。前置きや説明は不要です。
`
}

// フラッシュカード生成関数
export const generateFlashcards = async (
  content: string,
  cardType: string,
  language: string,
  additionalPrompt?: string,
) => {
  if (!genAI) {
    throw new Error("Google AI APIキーが設定されていません")
  }

  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      safetySettings,
    })

    const prompt = generateFlashcardsPrompt(content, cardType, language, additionalPrompt)

    console.log("Gemini API呼び出し開始")
    const result = await model.generateContent(prompt)
    console.log("Gemini API呼び出し完了")

    const response = result.response
    const text = response.text()
    console.log("Gemini APIレスポンス:", text.substring(0, 200) + "...")

    // JSONを解析
    try {
      // JSONを抽出するための正規表現パターン
      const jsonPattern = /\{[\s\S]*\}/g
      const jsonMatch = text.match(jsonPattern)

      if (!jsonMatch) {
        console.error("JSONが見つかりませんでした。レスポンス全文:", text)

        // JSONが見つからない場合は、テキストから簡易的にカードを生成
        const lines = text.split("\n").filter((line) => line.trim() !== "")
        const cards = []

        for (let i = 0; i < lines.length; i += 2) {
          if (i + 1 < lines.length) {
            cards.push({
              front: lines[i].replace(/^[Q\d.\-*]+[\s:]+/g, "").trim(),
              back: lines[i + 1].replace(/^[A\d.\-*]+[\s:]+/g, "").trim(),
            })
          }
        }

        if (cards.length > 0) {
          console.log("テキストから簡易的にカードを生成しました:", cards.length + "枚")
          return cards
        }

        throw new Error("JSONが見つかりませんでした")
      }

      const jsonText = jsonMatch[0]
      console.log("抽出されたJSON:", jsonText.substring(0, 200) + "...")

      try {
        const data = JSON.parse(jsonText)
        console.log("解析されたJSONデータ:", JSON.stringify(data).substring(0, 200) + "...")

        if (!data.cards || !Array.isArray(data.cards)) {
          throw new Error("有効なカードデータが見つかりませんでした")
        }

        return data.cards
      } catch (jsonError) {
        console.error("JSON解析エラー:", jsonError)
        throw new Error("フラッシュカードの生成結果を解析できませんでした")
      }
    } catch (error) {
      console.error("JSON解析エラー:", error)
      throw new Error("フラッシュカードの生成結果を解析できませんでした")
    }
  } catch (error) {
    console.error("Gemini APIエラー:", error)
    throw error
  }
}

// ヒント生成関数
export const generateHint = async (front: string, back: string) => {
  if (!genAI) {
    throw new Error("Google AI APIキーが設定されていません")
  }

  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      safetySettings,
    })

    const prompt = generateHintPrompt(front, back)
    const result = await model.generateContent(prompt)
    const response = result.response

    return response.text().trim()
  } catch (error) {
    console.error("Gemini APIエラー:", error)
    throw error
  }
}

// 詳細説明生成関数
export const generateDetails = async (front: string, back: string) => {
  if (!genAI) {
    throw new Error("Google AI APIキーが設定されていません")
  }

  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      safetySettings,
    })

    const prompt = generateDetailsPrompt(front, back)
    const result = await model.generateContent(prompt)
    const response = result.response

    return response.text().trim()
  } catch (error) {
    console.error("Gemini APIエラー:", error)
    throw error
  }
}
