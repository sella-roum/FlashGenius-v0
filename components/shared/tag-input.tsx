"use client"

import type React from "react"

import { useState, useRef } from "react"
import { X, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

interface TagInputProps {
  value: string[]
  onChange: (value: string[]) => void
  suggestions?: string[]
  placeholder?: string
  className?: string
}

export const TagInput = ({
  value,
  onChange,
  suggestions = [],
  placeholder = "タグを追加...",
  className,
}: TagInputProps) => {
  const [inputValue, setInputValue] = useState("")
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // 入力値をリセット
  const resetInput = () => {
    setInputValue("")
  }

  // タグを追加
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !value.includes(trimmedTag)) {
      onChange([...value, trimmedTag])
      resetInput()
    }
  }

  // タグを削除
  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  // キー入力処理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue) {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  // フィルタリングされたサジェスト
  const filteredSuggestions = suggestions.filter(
    (suggestion) => !value.includes(suggestion) && suggestion.toLowerCase().includes(inputValue.toLowerCase()),
  )

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px]">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
            {tag}
            <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeTag(tag)} />
          </Badge>
        ))}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              role="combobox"
              aria-expanded={open}
              className="h-8 px-2 py-1 border-none shadow-none hover:bg-transparent"
              onClick={() => inputRef.current?.focus()}
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={value.length === 0 ? placeholder : ""}
                className="outline-none bg-transparent"
              />
              {filteredSuggestions.length > 0 && <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
            </Button>
          </PopoverTrigger>
          {filteredSuggestions.length > 0 && (
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="タグを検索..." />
                <CommandList>
                  <CommandEmpty>見つかりませんでした</CommandEmpty>
                  <CommandGroup>
                    {filteredSuggestions.map((suggestion) => (
                      <CommandItem
                        key={suggestion}
                        onSelect={() => {
                          addTag(suggestion)
                          setOpen(false)
                        }}
                      >
                        <Check
                          className={cn("mr-2 h-4 w-4", value.includes(suggestion) ? "opacity-100" : "opacity-0")}
                        />
                        {suggestion}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          )}
        </Popover>
      </div>
    </div>
  )
}
