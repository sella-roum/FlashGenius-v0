"use client"

import { useState } from "react"
import Link from "next/link"
// import { useRouter } from "next/navigation" // ESLint修正: 未使用のため削除
import type { CardSet } from "@/types"
import { useIndexedDB } from "@/lib/hooks/use-indexed-db"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Trash2 } from "lucide-react"
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

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-lg">{cardSet.name}</h3>
            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md">{cardSet.theme}</span>
          </div>

          <p className="text-sm text-muted-foreground">
            {cardSet.cards.length}枚のカード • {formatDate(cardSet.createdAt)}作成
          </p>

          {cardSet.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {cardSet.tags.map((tag) => (
                <span key={tag} className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-1 rounded-md">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button asChild variant="default">
          <Link href={`/study?setIds=${cardSet.id}`} className="flex items-center">
            <BookOpen className="mr-2 h-4 w-4" />
            学習する
          </Link>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="text-destructive">
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
      </CardFooter>
    </Card>
  )
}
