// ファイル関連の定数
export const MAX_FILE_SIZE_MB = 10
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
export const ACCEPTED_FILE_TYPES = {
  "text/plain": [".txt"],
  "text/markdown": [".md"],
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
}

// 入力テキスト関連の定数
export const MAX_INPUT_CHAR_LENGTH_FOR_FLOW = 500000

// カードタイプの選択肢
export const CARD_TYPE_OPTIONS = [
  { value: "term-definition", label: "用語と定義" },
  { value: "qa", label: "質問と回答" },
  { value: "image-description", label: "画像と説明" },
]

// 言語の選択肢
export const LANGUAGE_OPTIONS = [
  { value: "japanese", label: "日本語" },
  { value: "english", label: "英語" },
  { value: "mixed", label: "混合（入力に合わせる）" },
]

// テーマの選択肢
export const THEME_OPTIONS = [
  { value: "default", label: "デフォルト" },
  { value: "science", label: "科学" },
  { value: "history", label: "歴史" },
  { value: "language", label: "言語" },
  { value: "programming", label: "プログラミング" },
  { value: "math", label: "数学" },
  { value: "other", label: "その他" },
]

// ナビゲーションリンク
export const NAV_LINKS = [
  { href: "/dashboard", label: "ダッシュボード", icon: "LayoutDashboard" },
  { href: "/generate", label: "生成", icon: "PlusCircle" },
  { href: "/library", label: "ライブラリ", icon: "Library" },
  { href: "/history", label: "学習履歴", icon: "History" },
]
