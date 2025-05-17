"use client"

import { useEffect, useState } from "react"
import { useStore } from "@/lib/store"
import { useIndexedDB } from "@/lib/hooks/use-indexed-db"
import { PageTitle } from "@/components/shared/page-title"
import { FilterControls } from "@/components/features/library/filter-controls"
import { CardSetList } from "@/components/features/library/card-set-list"
import { FullPageLoading } from "@/components/shared/loading-spinner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PlusCircle, Search } from "lucide-react"
import Link from "next/link"

export default function LibraryPage() {
  const { allCardSets, allTags, availableThemes } = useIndexedDB()
  const [searchTerm, setSearchTerm] = useState("")

  const {
    setAllCardSets,
    setAvailableThemes,
    setAvailableTags,
    library: { filteredCardSets },
    setFilterTheme,
    addFilterTag,
    removeFilterTag,
    resetFilters,
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

  // 検索フィルタリング
  const searchFilteredSets = searchTerm
    ? filteredCardSets.filter(
        (set) =>
          set.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          set.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    : filteredCardSets

  return (
    <div className="space-y-6">
      <PageTitle title="カードセットライブラリ" subtitle="保存したカードセットを管理し、学習を始めましょう。" />

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative w-full md:w-1/2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="セット名やタグで検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button asChild>
          <Link href="/generate">
            <PlusCircle className="mr-2 h-5 w-5" />
            新しいセットを作成
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <FilterControls />
        </div>

        <div className="md:col-span-3">
          <CardSetList cardSets={searchFilteredSets} />
        </div>
      </div>
    </div>
  )
}
