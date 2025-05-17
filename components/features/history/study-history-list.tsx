"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate } from "@/lib/utils"
import { CheckCircle, XCircle, Clock } from "lucide-react"

interface StudySession {
  id: string
  cardSetId: string
  cardSetName: string
  cardSetTheme: string
  startedAt: Date
  completedAt: Date
  cardsReviewed: number
  correctAnswers: number
  incorrectAnswers: number
  totalTimeSpent: number
  accuracy: number
}

interface StudyHistoryListProps {
  sessions: StudySession[]
}

export const StudyHistoryList = ({ sessions }: StudyHistoryListProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<string>("date")
  const [filterTheme, setFilterTheme] = useState<string>("all")

  // テーマの一覧を取得
  const themes = Array.from(new Set(sessions.map((session) => session.cardSetTheme)))

  // フィルタリングと並べ替え
  const filteredSessions = sessions
    .filter((session) => {
      // 検索語でフィルタリング
      const matchesSearch = session.cardSetName.toLowerCase().includes(searchTerm.toLowerCase())

      // テーマでフィルタリング
      const matchesTheme = filterTheme === "all" || session.cardSetTheme === filterTheme

      return matchesSearch && matchesTheme
    })
    .sort((a, b) => {
      // 並べ替え
      switch (sortBy) {
        case "date":
          return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
        case "name":
          return a.cardSetName.localeCompare(b.cardSetName)
        case "accuracy":
          return b.accuracy - a.accuracy
        case "cards":
          return b.cardsReviewed - a.cardsReviewed
        default:
          return 0
      }
    })

  // 時間のフォーマット（ミリ秒 → mm:ss）
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>学習セッション履歴</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* フィルターと検索 */}
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="セット名で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:w-1/3"
            />

            <Select value={filterTheme} onValueChange={setFilterTheme}>
              <SelectTrigger className="md:w-1/3">
                <SelectValue placeholder="テーマでフィルター" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのテーマ</SelectItem>
                {themes.map((theme) => (
                  <SelectItem key={theme} value={theme}>
                    {theme}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="md:w-1/3">
                <SelectValue placeholder="並べ替え" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">日付（新しい順）</SelectItem>
                <SelectItem value="name">セット名</SelectItem>
                <SelectItem value="accuracy">正解率</SelectItem>
                <SelectItem value="cards">カード数</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* セッション一覧テーブル */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日付</TableHead>
                  <TableHead>セット名</TableHead>
                  <TableHead>テーマ</TableHead>
                  <TableHead className="text-right">カード数</TableHead>
                  <TableHead className="text-right">正解</TableHead>
                  <TableHead className="text-right">不正解</TableHead>
                  <TableHead className="text-right">正解率</TableHead>
                  <TableHead className="text-right">時間</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.length > 0 ? (
                  filteredSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>{formatDate(new Date(session.completedAt))}</TableCell>
                      <TableCell className="font-medium">{session.cardSetName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{session.cardSetTheme}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{session.cardsReviewed}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                          {session.correctAnswers}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          <XCircle className="h-4 w-4 text-red-500 mr-1" />
                          {session.incorrectAnswers}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            session.accuracy >= 80 ? "success" : session.accuracy >= 60 ? "default" : "secondary"
                          }
                        >
                          {Math.round(session.accuracy)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          <Clock className="h-4 w-4 text-blue-500 mr-1" />
                          {formatTime(session.totalTimeSpent)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">
                      該当する学習セッションがありません
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
