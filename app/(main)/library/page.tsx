"use client"

import { useEffect } from "react"
import { useStore } from "@/lib/store"
import { useIndexedDB } from "@/lib/hooks/use-indexed-db"
import { PageTitle } from "@/components/shared/page-title"
import { FilterControls } from "@/components/features/library/filter-controls"
import { CardSetList } from "@/components/features/library/card-set-list"
import { FullPageLoading } from "@/components/shared/loading-spinner"

export default function LibraryPage() {
  const { allCardSets, allTags, availableThemes } = useIndexedDB()

  const {
    setAllCardSets,
    setAvailableThemes,
    setAvailableTags,
    library: { filteredCardSets },
  } = useStore()

  useEffect(() => {
    if (allCardSets) {
      setAllCardSets(allCardSets)
    }
  }, [allCardSets, setAllCardSets])

  useEffect(() => {
    if (availableThemes) {
      setAvailableThemes(availableThemes)
    }
  }, [availableThemes, setAvailableThemes])

  useEffect(() => {
    if (allTags) {
      setAvailableTags(allTags)
    }
  }, [allTags, setAvailableTags])

  if (!allCardSets || !allTags || !availableThemes) {
    return <FullPageLoading message="ライブラリを読み込み中..." />
  }

  return (
    <div className="space-y-6">
      <PageTitle title="カードセットライブラリ" subtitle="保存したカードセットを管理し、学習を始めましょう。" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <FilterControls />
        </div>

        <div className="md:col-span-3">
          <CardSetList cardSets={filteredCardSets} />
        </div>
      </div>
    </div>
  )
}
