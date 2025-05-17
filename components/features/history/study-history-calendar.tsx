"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
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

interface StudyHistoryCalendarProps {
  sessions: StudySession[]
}

export const StudyHistoryCalendar = ({ sessions }: StudyHistoryCalendarProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedDateSessions, setSelectedDateSessions] = useState<StudySession[]>([])

  // 日付ごとのセッション数を計算
  const sessionsByDate = sessions.reduce(
    (acc, session) => {
      const dateStr = new Date(session.completedAt).toDateString()

      if (!acc[dateStr]) {
        acc[dateStr] = []
      }

      acc[dateStr].push(session)
      return acc
    },
    {} as Record<string, StudySession[]>,
  )

  // 日付が選択されたときの処理
  const handleSelect = (date: Date | undefined) => {
    setDate(date)

    if (date) {
      const dateStr = date.toDateString()
      setSelectedDateSessions(sessionsByDate[dateStr] || [])
    } else {
      setSelectedDateSessions([])
    }
  }

  // 時間のフォーマット（ミリ秒 → mm:ss）
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  // カレンダーの日付装飾
  const dayClassName = (date: Date) => {
    const dateStr = date.toDateString()
    const sessionsForDate = sessionsByDate[dateStr] || []

    if (sessionsForDate.length > 0) {
      // セッションがある日付は強調表示
      return "bg-primary/10 rounded-full font-bold"
    }

    return ""
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>学習カレンダー</CardTitle>
          <CardDescription>日付を選択して学習セッションを確認できます</CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            className="rounded-md border"
            modifiersClassNames={{
              selected: "bg-primary text-primary-foreground",
            }}
            components={{
              DayContent: ({ date }) => {
                const dateStr = date.toDateString()
                const sessionsForDate = sessionsByDate[dateStr] || []

                return (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <div>{date.getDate()}</div>
                    {sessionsForDate.length > 0 && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                        <div className="h-1 w-1 bg-primary rounded-full" />
                      </div>
                    )}
                  </div>
                )
              },
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{date ? formatDate(date) : "日付を選択してください"}</CardTitle>
          <CardDescription>
            {selectedDateSessions.length > 0
              ? `${selectedDateSessions.length}件の学習セッション`
              : "この日の学習セッションはありません"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedDateSessions.length > 0 ? (
            <div className="space-y-4">
              {selectedDateSessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{session.cardSetName}</h3>
                      <Badge variant="outline" className="mt-1">
                        {session.cardSetTheme}
                      </Badge>
                    </div>
                    <Badge
                      variant={session.accuracy >= 80 ? "success" : session.accuracy >= 60 ? "default" : "secondary"}
                    >
                      {Math.round(session.accuracy)}%
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      <span>{session.correctAnswers} 正解</span>
                    </div>
                    <div className="flex items-center">
                      <XCircle className="h-4 w-4 text-red-500 mr-1" />
                      <span>{session.incorrectAnswers} 不正解</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-blue-500 mr-1" />
                      <span>{formatTime(session.totalTimeSpent)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              {date ? "この日の学習セッションはありません" : "日付を選択してください"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
