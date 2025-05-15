"use client"

import { useEffect } from "react"
import { useStore } from "@/lib/store"
import { useIndexedDB } from "@/lib/hooks/use-indexed-db"
import { PageTitle } from "@/components/shared/page-title"
import { QuickAccess } from "@/components/features/dashboard/quick-access"
import { StudySuggestions } from "@/components/features/dashboard/study-suggestions"
import { RecentActivity } from "@/components/features/dashboard/recent-activity"
import { LearningProgress } from "@/components/features/dashboard/learning-progress"
import { FullPageLoading } from "@/components/shared/loading-spinner"

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

  return (
    <div className="space-y-8">
      <PageTitle
        title="ダッシュボード"
        subtitle="FlashGeniusへようこそ。AIを活用したフラッシュカード学習を始めましょう。"
      />

      <div className="grid gap-6 md:grid-cols-2">
        <QuickAccess />
        <StudySuggestions cardSets={allCardSets} />
      </div>

      <LearningProgress />

      <RecentActivity cardSets={allCardSets} />
    </div>
  )
}
