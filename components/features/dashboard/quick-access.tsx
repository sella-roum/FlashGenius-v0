import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Library } from "lucide-react"
import { Button } from "@/components/ui/button"

export const QuickAccess = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>クイックアクセス</CardTitle>
        <CardDescription>よく使う機能にすぐにアクセスできます</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Button asChild className="w-full" size="lg">
          <Link href="/generate" className="flex items-center">
            <PlusCircle className="mr-2 h-5 w-5" />
            新しいセットを生成
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full" size="lg">
          <Link href="/library" className="flex items-center">
            <Library className="mr-2 h-5 w-5" />
            ライブラリを見る
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
