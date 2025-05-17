"use client"

import { useState } from "react"
import Link from "next/link"
// import { useRouter } from "next/navigation" // ESLint修正: 未使用のため削除
import type { CardSet } from "@/types"
import { useIndexedDB } from "@/lib/hooks/use-indexed-db"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Trash2, Edit, BarChart2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"

interface CardSetItemProps {
  cardSet: CardSet
}

export const CardSetItem = ({ cardSet }: CardSetItemProps) => {
  // const router = useRouter() // ESLint修正: 未使用のため削除
  const { toast } = useToast()
  const { deleteCardSet } = useIndexedDB()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteCardSet(cardSet.id)
      toast({
        title: "削除完了",
        description: "カードセットが削除されました。",
      })
    } catch (error) {
      toast({
        title: "削除エラー",
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // 学習進捗の計算
  const totalCards = cardSet.totalCards || cardSet.cards.length
  const masteredCards = cardSet.masteredCards || 0
  const learningCards = cardSet.learningCards || 0
  const newCards = cardSet.newCards || totalCards

  const masteredPercentage = totalCards > 0 ? (masteredCards / totalCards) * 100 : 0
  const learningPercentage = totalCards > 0 ? (learningCards / totalCards) * 100 : 0
  const newPercentage = totalCards > 0 ? (newCards / totalCards) * 100 : 0

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{cardSet.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="bg-secondary/50">
                  {cardSet.theme}
                </Badge>
                <span className="text-xs text-muted-foreground">{formatDate(cardSet.createdAt)}作成</span>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              {cardSet.cards.length}枚のカード
            </Badge>
          </div>

          {cardSet.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {cardSet.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs bg-primary/5">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* 学習進捗バー */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>学習進捗</span>
              <span>{Math.round(masteredPercentage)}% マスター</span>
            </div>
            <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
              <div className="flex h-full">
                <div className="bg-green-500" style={{ width: `${masteredPercentage}%` }}></div>
                <div className="bg-blue-500" style={{ width: `${learningPercentage}%` }}></div>
                <div className="bg-gray-300 dark:bg-gray-600" style={{ width: `${newPercentage}%` }}></div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{masteredCards} マスター済み</span>
              <span>{learningCards} 学習中</span>
              <span>{newCards} 未学習</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-wrap gap-2 justify-between bg-muted/20">
        <div className="flex gap-2">
          <Button asChild variant="default" size="sm">
            <Link href={`/study?setIds=${cardSet.id}`} className="flex items-center">
              <BookOpen className="mr-2 h-4 w-4" />
              学習する
            </Link>
          </Button>

          <Button asChild variant="outline" size="sm">
            <Link href={`/history?setId=${cardSet.id}`} className="flex items-center">
              <BarChart2 className="mr-2 h-4 w-4" />
              統計
            </Link>
          </Button>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/edit?id=${cardSet.id}`}>
              <Edit className="mr-2 h-4 w-4" />
              編集
            </Link>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                削除
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>カードセットを削除しますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  この操作は元に戻せません。「{cardSet.name}」とそのすべてのカードが完全に削除されます。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "削除中..." : "削除する"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  )
}
