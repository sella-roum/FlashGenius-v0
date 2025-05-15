"use client"

import type { CardSet } from "@/types"
import { CardSetItem } from "@/components/features/library/card-set-item"

interface CardSetListProps {
  cardSets: CardSet[]
}

export const CardSetList = ({ cardSets }: CardSetListProps) => {
  if (cardSets.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">
          カードセットが見つかりません。フィルターを変更するか、新しいセットを作成してください。
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {cardSets.map((cardSet) => (
        <CardSetItem key={cardSet.id} cardSet={cardSet} />
      ))}
    </div>
  )
}
