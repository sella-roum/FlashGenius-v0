import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, PlusCircle } from "lucide-react"
import type { CardSet } from "@/types"
import { formatDate } from "@/lib/utils"

interface StudySuggestionsProps {
  cardSets: CardSet[]
}

export const StudySuggestions = ({ cardSets }: StudySuggestionsProps) => {
  // 最も古いカードセットを取得（最後に学習したのが古いものを優先）
  const suggestedSet =
    cardSets.length > 0 ? [...cardSets].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0] : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>おすすめの学習</CardTitle>
        <CardDescription>今日の学習におすすめのカードセット</CardDescription>
      </CardHeader>
      <CardContent>
        {suggestedSet ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{suggestedSet.name}</h3>
              <p className="text-sm text-muted-foreground">
                {suggestedSet.cards.length}枚のカード • {formatDate(suggestedSet.createdAt)}作成
              </p>
              {suggestedSet.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {suggestedSet.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <Button asChild className="w-full">
              <Link href={`/study?setIds=${suggestedSet.id}`} className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                今すぐ学習する
              </Link>
            </Button>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground">カードセットがまだありません。新しいセットを生成してみましょう。</p>
            <Button asChild className="mt-4">
              <Link href="/generate">
                <PlusCircle className="mr-2 h-5 w-5" />
                新しいセットを生成
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
