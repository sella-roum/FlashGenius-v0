"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"

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

interface StudyHistoryChartProps {
  sessions: StudySession[]
}

export const StudyHistoryChart = ({ sessions }: StudyHistoryChartProps) => {
  const [timeRange, setTimeRange] = useState<string>("week")
  const [chartData, setChartData] = useState<any[]>([])
  const [accuracyData, setAccuracyData] = useState<any[]>([])

  useEffect(() => {
    // 日付範囲の計算
    const now = new Date()
    let startDate: Date

    switch (timeRange) {
      case "week":
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        break
      case "month":
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 1)
        break
      case "year":
        startDate = new Date(now)
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
    }

    // 日付範囲内のセッションをフィルタリング
    const filteredSessions = sessions.filter(
      (session) => new Date(session.completedAt).getTime() >= startDate.getTime(),
    )

    // 日付ごとにグループ化
    const sessionsByDate = filteredSessions.reduce(
      (acc, session) => {
        const date = new Date(session.completedAt)
        const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`

        if (!acc[dateStr]) {
          acc[dateStr] = {
            date: dateStr,
            cardsReviewed: 0,
            correctAnswers: 0,
            incorrectAnswers: 0,
            totalTimeSpent: 0,
            sessions: 0,
          }
        }

        acc[dateStr].cardsReviewed += session.cardsReviewed
        acc[dateStr].correctAnswers += session.correctAnswers
        acc[dateStr].incorrectAnswers += session.incorrectAnswers
        acc[dateStr].totalTimeSpent += session.totalTimeSpent
        acc[dateStr].sessions += 1

        return acc
      },
      {} as Record<string, any>,
    )

    // 日付でソート
    const sortedDates = Object.keys(sessionsByDate).sort()

    // チャートデータの作成
    const chartData = sortedDates.map((date) => ({
      date,
      正解: sessionsByDate[date].correctAnswers,
      不正解: sessionsByDate[date].incorrectAnswers,
      カード数: sessionsByDate[date].cardsReviewed,
      学習時間: Math.round(sessionsByDate[date].totalTimeSpent / 60000), // 分単位
    }))

    // 正解率データの作成
    const accuracyData = sortedDates.map((date) => {
      const data = sessionsByDate[date]
      const accuracy = data.cardsReviewed > 0 ? (data.correctAnswers / data.cardsReviewed) * 100 : 0

      return {
        date,
        正解率: Math.round(accuracy),
        セッション数: data.sessions,
      }
    })

    setChartData(chartData)
    setAccuracyData(accuracyData)
  }, [sessions, timeRange])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>学習統計グラフ</CardTitle>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="期間" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">過去7日間</SelectItem>
            <SelectItem value="month">過去1ヶ月</SelectItem>
            <SelectItem value="year">過去1年</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="cards" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full md:w-auto">
            <TabsTrigger value="cards">カード数</TabsTrigger>
            <TabsTrigger value="accuracy">正解率</TabsTrigger>
            <TabsTrigger value="time">学習時間</TabsTrigger>
          </TabsList>

          <TabsContent value="cards" className="h-[400px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="正解" fill="#10b981" />
                  <Bar dataKey="不正解" fill="#ef4444" />
                  <Bar dataKey="カード数" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">この期間のデータがありません</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="accuracy" className="h-[400px]">
            {accuracyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={accuracyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" domain={[0, 100]} />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="正解率" stroke="#10b981" activeDot={{ r: 8 }} />
                  <Line yAxisId="right" type="monotone" dataKey="セッション数" stroke="#6366f1" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">この期間のデータがありません</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="time" className="h-[400px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="学習時間" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">この期間のデータがありません</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
