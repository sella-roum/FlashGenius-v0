"use client"

import { useEffect } from "react"
import { useStore } from "@/lib/store"
import { useIndexedDB } from "@/lib/hooks/use-indexed-db"
import { PageTitle } from "@/components/shared/page-title"
import { StudySuggestions } from "@/components/features/dashboard/study-suggestions"
import { LearningProgress } from "@/components/features/dashboard/learning-progress"
import { FullPageLoading } from "@/components/shared/loading-spinner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, PlusCircle, Library, History } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { allCardSets } = useIndexedDB()
  const { setAllCardSets } = useStore()

  useEffect(() => {
    if (allCardSets) {
      setAllCardSets(allCardSets)
    }
  }, [allCardSets, setAllCardSets])

  if (!allCardSets) {
    return <FullPageLoading message="ダッシュボードを読み込み中..." />
  }

  // 最近の学習セッション数を計算
  const recentSets =
    allCardSets.length > 0
      ? [...allCardSets].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 3)
      : []

  return (
    <div className="space-y-8">
      <PageTitle
        title="ダッシュボード"
        subtitle="FlashGeniusへようこそ。AIを活用したフラッシュカード学習を始めましょう。"
      />

      {/* ウェルカムカード */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-2 items-center">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">AIパワードフラッシュカード</h2>
              <p className="text-muted-foreground">
                テキスト、URL、またはファイルから自動的にフラッシュカードを生成し、効率的に学習を進めましょう。
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/generate">
                    <PlusCircle className="h-5 w-5" />
                    カードを生成する
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2">
                  <Link href="/library">
                    <Library className="h-5 w-5" />
                    ライブラリを見る
                  </Link>
                </Button>
              </div>
            </div>
            <div className="hidden md:flex justify-end">
              <div className="relative w-64 h-64">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-lg transform rotate-6"></div>
                <div className="absolute top-4 right-4 w-48 h-48 bg-primary/30 rounded-lg transform rotate-3"></div>
                <div className="absolute top-8 right-8 w-48 h-48 bg-primary/40 rounded-lg"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <LearningProgress />
        <StudySuggestions cardSets={allCardSets} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* クイックアクセスカード */}
        <Card>
          <CardHeader>
            <CardTitle>クイックアクション</CardTitle>
            <CardDescription>よく使う機能にすぐにアクセス</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full justify-start">
              <Link href="/generate">
                <PlusCircle className="mr-2 h-5 w-5" />
                新しいセットを生成
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/library">
                <Library className="mr-2 h-5 w-5" />
                ライブラリを見る
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/history">
                <History className="mr-2 h-5 w-5" />
                学習履歴を確認
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* 最近のセット */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>最近のカードセット</CardTitle>
            <CardDescription>最近作成または学習したセット</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSets.length > 0 ? (
              <div className="space-y-4">
                {recentSets.map((set) => (
                  <div key={set.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <h3 className="font-medium">{set.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {set.cards.length}枚のカード • {set.theme}
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
                <p className="text-muted-foreground">
                  カードセットがまだありません。新しいセットを生成してみましょう。
                </p>
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
      </div>
    </div>
  )
}
