"use client"

import { useState, useEffect, useCallback } from "react"
import type { CardSet, Tag } from "@/types"

export const useIndexedDB = () => {
  const [allCardSets, setAllCardSets] = useState<CardSet[] | undefined>(undefined)
  const [allTags, setAllTags] = useState<Tag[] | undefined>(undefined)
  const [availableThemes, setAvailableThemes] = useState<string[] | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // データの読み込み
  const loadData = useCallback(async () => {
    if (typeof window === "undefined") return

    try {
      setIsLoading(true)
      setError(null)

      // 動的インポート
      const indexedDB = await import("@/lib/indexed-db")

      // データの取得
      const [cardSets, tags, themes] = await Promise.all([
        indexedDB.getAllCardSets(),
        indexedDB.getAllTags(),
        indexedDB.getAvailableThemes(),
      ])

      setAllCardSets(cardSets)
      setAllTags(tags)
      setAvailableThemes(themes)
    } catch (err) {
      console.error("Failed to load data from IndexedDB:", err)
      setError(err instanceof Error ? err : new Error("Unknown error"))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 初期データ読み込み
  useEffect(() => {
    loadData()
  }, [loadData])

  // カードセットの追加
  const addCardSet = useCallback(
    async (cardSet: Omit<CardSet, "id" | "createdAt" | "updatedAt">) => {
      try {
        const indexedDB = await import("@/lib/indexed-db")
        const id = await indexedDB.addCardSet(cardSet)

        // データを再読み込み
        loadData()

        return id
      } catch (err) {
        console.error("Failed to add card set:", err)
        throw err instanceof Error ? err : new Error("Failed to add card set")
      }
    },
    [loadData],
  )

  // カードセットの取得（ID指定）
  const getCardSetById = useCallback(async (id: string) => {
    try {
      const indexedDB = await import("@/lib/indexed-db")
      return await indexedDB.getCardSetById(id)
    } catch (err) {
      console.error(`Failed to get card set with id ${id}:`, err)
      throw err instanceof Error ? err : new Error(`Failed to get card set with id ${id}`)
    }
  }, [])

  // カードセットの更新
  const updateCardSet = useCallback(
    async (id: string, updates: Partial<Omit<CardSet, "id" | "createdAt" | "updatedAt">>) => {
      try {
        const indexedDB = await import("@/lib/indexed-db")
        await indexedDB.updateCardSet(id, updates)

        // データを再読み込み
        loadData()
      } catch (err) {
        console.error(`Failed to update card set with id ${id}:`, err)
        throw err instanceof Error ? err : new Error(`Failed to update card set with id ${id}`)
      }
    },
    [loadData],
  )

  // カードセットの削除
  const deleteCardSet = useCallback(
    async (id: string) => {
      try {
        const indexedDB = await import("@/lib/indexed-db")
        await indexedDB.deleteCardSet(id)

        // データを再読み込み
        loadData()
      } catch (err) {
        console.error(`Failed to delete card set with id ${id}:`, err)
        throw err instanceof Error ? err : new Error(`Failed to delete card set with id ${id}`)
      }
    },
    [loadData],
  )

  return {
    allCardSets,
    allTags,
    availableThemes,
    isLoading,
    error,
    addCardSet,
    getCardSetById,
    updateCardSet,
    deleteCardSet,
    refreshData: loadData,
  }
}
