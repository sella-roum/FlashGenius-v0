import {
  GoogleGenAI,
  HarmBlockThreshold,
  HarmCategory,
  GenerateContentResponse,
  // Content, // generateContentのcontentsは string | Part | (string | Part)[] で渡せるため、直接Content型を使う必要は少ない
  // Part,    // 同上
  Type,
  SafetySetting,
  GenerationConfig,
  GenerateContentParameters, // GenerateContentの引数の型
} from "@google/genai";

// APIキーの取得
const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

// Google AI SDKの初期化
const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

// モデルの設定
const modelName = "gemini-2.0-flash";

// フラッシュカード生成用のプロンプト
export const generateFlashcardsPrompt = (
  content: string,
  cardType: string,
  language: string,
  additionalPrompt?: string,
): string => {
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
`;

  let formatPrompt = "";

  switch (cardType) {
    case "term-definition":
      formatPrompt = `
- 表面: 重要な用語、概念、または名前
- 裏面: その用語の定義、説明、または重要性
`;
      break;
    case "qa":
      formatPrompt = `
- 表面: 質問形式で内容を問う
- 裏面: 質問に対する回答
`;
      break;
    case "image-description":
      formatPrompt = `
- 表面: 画像に関する説明や質問（画像がある場合）
- 裏面: 説明の詳細または質問の回答
`;
      break;
    default:
      formatPrompt = `
- 表面: 重要な用語、概念、または名前
- 裏面: その用語の定義、説明、または重要性
`;
  }

  let languagePrompt = "";

  switch (language) {
    case "japanese":
      languagePrompt = "- すべてのカードは日本語で作成してください。";
      break;
    case "english":
      languagePrompt = "- すべてのカードは英語で作成してください。";
      break;
    case "mixed":
      languagePrompt = "- 元の内容の言語に合わせてカードを作成してください。";
      break;
    default:
      languagePrompt = "- 元の内容の言語に合わせてカードを作成してください。";
  }

  const additionalInstructions = additionalPrompt
    ? `\n## 追加指示\n${additionalPrompt}`
    : "";

  const outputFormatInstruction = `
JSON形式で、各カードが "front" と "back" のキーを持つオブジェクトの配列として "cards" というキーの中に格納されるようにしてください。
`;

  const fullPrompt = `${basePrompt}${formatPrompt}\n${languagePrompt}${additionalInstructions}\n\n## 内容\n${content}\n${outputFormatInstruction}`;

  return fullPrompt;
};

// ヒント生成用のプロンプト
export const generateHintPrompt = (front: string, back: string): string => {
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
`;
};

// 詳細説明生成用のプロンプト
export const generateDetailsPrompt = (front: string, back: string): string => {
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
`;
};

interface Flashcard {
  front: string;
  back: string;
}

// フラッシュカード生成関数
export const generateFlashcards = async (
  content: string,
  cardType: string,
  language: string,
  additionalPrompt?: string,
): Promise<Flashcard[]> => {
  if (!genAI) {
    throw new Error("Google AI APIキーが設定されていません");
  }

  try {
    const prompt = generateFlashcardsPrompt(
      content,
      cardType,
      language,
      additionalPrompt,
    );

    console.log("Gemini API呼び出し開始 (generateFlashcards)");

    const params: GenerateContentParameters = { // GenerateContentParameters 型を明示
      model: modelName,
      contents: [{ parts: [{ text: prompt }], role: "user" }],
      config: { // generationConfig をトップレベルに配置
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cards: {
              type: Type.ARRAY,
              description: "生成されたフラッシュカードの配列",
              items: {
                type: Type.OBJECT,
                properties: {
                  front: {
                    type: Type.STRING,
                    description: "カードの表面のテキスト",
                  },
                  back: {
                    type: Type.STRING,
                    description: "カードの裏面のテキスト",
                  },
                },
                required: ["front", "back"],
              },
            },
          },
          required: ["cards"],
        },
        // 必要に応じて他の generationConfig パラメータ (temperature, topK など) を追加
      },
    };

    const result: GenerateContentResponse = await genAI.models.generateContent(params);
    console.log("Gemini API呼び出し完了 (generateFlashcards)");

    const text = result.text;
    if (!text) {
      console.error("Gemini APIからのレスポンスが空です。", result);
      if (result.candidates && result.candidates[0].finishReason !== 'STOP' && result.candidates[0].finishReason !== 'MAX_TOKENS') {
        throw new Error(`モデルが正常に完了しませんでした: ${result.candidates[0].finishReason}. ${result.candidates[0].finishMessage || ''}`);
      }
      throw new Error("モデルからのレスポンスが空でした");
    }

    console.log(
      "Gemini APIレスポンス (generateFlashcards):",
      text.substring(0, 200) + "...",
    );

    try {
      const data = JSON.parse(text);
      console.log(
        "解析されたJSONデータ (generateFlashcards):",
        JSON.stringify(data).substring(0, 200) + "...",
      );

      if (!data.cards || !Array.isArray(data.cards)) {
        console.error("レスポンスに有効な 'cards' 配列が含まれていません。レスポンス:", data);
        throw new Error("有効なカードデータ (cards配列) がレスポンスに含まれていませんでした");
      }

      const validatedCards = data.cards.filter(
        (card: any): card is Flashcard =>
          typeof card === 'object' &&
          card !== null &&
          typeof card.front === 'string' &&
          typeof card.back === 'string'
      );

      if (validatedCards.length !== data.cards.length) {
        console.warn("一部のカードが無効な形式でした。フィルタリング後のカード数:", validatedCards.length);
      }
      if (validatedCards.length === 0 && data.cards.length > 0) {
        throw new Error("有効な形式のカードデータが1件も見つかりませんでした。");
      }
      if (validatedCards.length === 0 && data.cards.length === 0) {
        console.warn("モデルはカードを生成しませんでした。");
        return [];
      }

      return validatedCards;
    } catch (jsonError: any) {
      console.error("JSON解析エラー (generateFlashcards):", jsonError);
      console.error("エラーが発生したレスポンステキスト:", text);
      throw new Error(`フラッシュカードの生成結果を解析できませんでした: ${jsonError.message}`);
    }
  } catch (error: any) {
    console.error("Gemini APIエラー (generateFlashcards):", error);
    throw new Error(`Gemini APIエラー: ${error.message || error}`);
  }
};

// ヒント生成関数
export const generateHint = async (front: string, back: string): Promise<string> => {
  if (!genAI) {
    throw new Error("Google AI APIキーが設定されていません");
  }

  try {
    const prompt = generateHintPrompt(front, back);
    console.log("Gemini API呼び出し開始 (generateHint)");

    const params: GenerateContentParameters = { // GenerateContentParameters 型を明示
      model: modelName,
      contents: [{ parts: [{ text: prompt }], role: "user" }],
      // safetySettings, // safetySettings をトップレベルに配置
      // generationConfig: { // 必要であれば他の設定を追加
      //   // temperature: 0.7,
      // }
    };

    const result: GenerateContentResponse = await genAI.models.generateContent(params);
    console.log("Gemini API呼び出し完了 (generateHint)");

    if (!result.text) {
      console.error("Gemini APIからのヒントレスポンスが空です。", result);
      if (result.candidates && result.candidates[0].finishReason !== 'STOP') {
         throw new Error(`モデルが正常に完了しませんでした (ヒント生成): ${result.candidates[0].finishReason}. ${result.candidates[0].finishMessage || ''}`);
      }
      throw new Error("モデルからのヒントレスポンスが空でした");
    }
    return result.text.trim();
  } catch (error: any) {
    console.error("Gemini APIエラー (generateHint):", error);
    throw new Error(`Gemini APIエラー (ヒント生成): ${error.message || error}`);
  }
};

// 詳細説明生成関数
export const generateDetails = async (front: string, back: string): Promise<string> => {
  if (!genAI) {
    throw new Error("Google AI APIキーが設定されていません");
  }

  try {
    const prompt = generateDetailsPrompt(front, back);
    console.log("Gemini API呼び出し開始 (generateDetails)");

    const params: GenerateContentParameters = { // GenerateContentParameters 型を明示
      model: modelName,
      contents: [{ parts: [{ text: prompt }], role: "user" }],
      // safetySettings, // safetySettings をトップレベルに配置
      // generationConfig: { // 必要であれば他の設定を追加
      //   // temperature: 0.7,
      // }
    };

    const result: GenerateContentResponse = await genAI.models.generateContent(params);
    console.log("Gemini API呼び出し完了 (generateDetails)");

    if (!result.text) {
      console.error("Gemini APIからの詳細説明レスポンスが空です。", result);
       if (result.candidates && result.candidates[0].finishReason !== 'STOP') {
         throw new Error(`モデルが正常に完了しませんでした (詳細説明生成): ${result.candidates[0].finishReason}. ${result.candidates[0].finishMessage || ''}`);
      }
      throw new Error("モデルからの詳細説明レスポンスが空でした");
    }
    return result.text.trim();
  } catch (error: any) {
    console.error("Gemini APIエラー (generateDetails):", error);
    throw new Error(`Gemini APIエラー (詳細説明生成): ${error.message || error}`);
  }
};