import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"
import type { CardSet } from "@/types"
import { formatDate } from "@/lib/utils"

interface RecentActivityProps {
  cardSets: CardSet[]
}

export const RecentActivity = ({ cardSets }: RecentActivityProps) => {
  // 最近作成されたカードセットを取得（最大5件）
  const recentSets = [...cardSets].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>最近のアクティビティ</CardTitle>
        <CardDescription>最近作成したカードセット</CardDescription>
      </CardHeader>
      <CardContent>
        {recentSets.length > 0 ? (
          <div className="space-y-4">
            {recentSets.map((set) => (
              <div key={set.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div>
                  <h3 className="font-medium">{set.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {set.cards.length}枚のカード • {formatDate(set.createdAt)}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/study?setIds=${set.id}`}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    学習
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground">カードセットがまだありません。新しいセットを生成してみましょう。</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
