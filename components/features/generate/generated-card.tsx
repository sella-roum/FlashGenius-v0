"use client"

import type { Flashcard } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface GeneratedCardProps {
  card: Flashcard
  index: number
  onUpdate: (updates: Partial<Flashcard>) => void
  onDelete: () => void
}

export const GeneratedCard = ({ card, index, onUpdate, onDelete }: GeneratedCardProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">カード {index + 1}</h4>
          <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-destructive">
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">削除</span>
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor={`card-front-${index}`} className="text-sm font-medium">
              表面
            </label>
            <Textarea
              id={`card-front-${index}`}
              value={card.front}
              onChange={(e) => onUpdate({ front: e.target.value })}
              placeholder="カードの表面..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor={`card-back-${index}`} className="text-sm font-medium">
              裏面
            </label>
            <Textarea
              id={`card-back-${index}`}
              value={card.back}
              onChange={(e) => onUpdate({ back: e.target.value })}
              placeholder="カードの裏面..."
              rows={3}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
