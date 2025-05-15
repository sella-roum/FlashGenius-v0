"use client"

import { useStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"

export const FilterControls = () => {
  const {
    library: { filterTheme, filterTags, availableThemes, availableTags },
    setFilterTheme,
    addFilterTag,
    removeFilterTag,
    resetFilters,
  } = useStore()

  const handleTagChange = (tag: string, checked: boolean) => {
    if (checked) {
      addFilterTag(tag)
    } else {
      removeFilterTag(tag)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>フィルター</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="theme-filter">テーマ</Label>
          <Select value={filterTheme || ""} onValueChange={(value) => setFilterTheme(value || null)}>
            <SelectTrigger id="theme-filter">
              <SelectValue placeholder="すべてのテーマ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべてのテーマ</SelectItem>
              {availableThemes.map((theme) => (
                <SelectItem key={theme} value={theme}>
                  {theme}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {availableTags.length > 0 && (
          <div className="space-y-2">
            <Label>タグ</Label>
            <div className="space-y-2">
              {availableTags.map((tag) => (
                <div key={tag.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tag-${tag.id}`}
                    checked={filterTags.includes(tag.name)}
                    onCheckedChange={(checked) => handleTagChange(tag.name, checked as boolean)}
                  />
                  <Label htmlFor={`tag-${tag.id}`} className="text-sm cursor-pointer">
                    {tag.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={resetFilters}
          disabled={!filterTheme && filterTags.length === 0}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          フィルターをリセット
        </Button>
      </CardContent>
    </Card>
  )
}
