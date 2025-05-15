"use client"

import { type ReactNode, createContext, useRef } from "react"
import { useStore } from "@/lib/store"

interface ZustandProviderProps {
  children: ReactNode
}

export const ZustandContext = createContext<ReturnType<typeof useStore> | null>(null)

export const ZustandProvider = ({ children }: ZustandProviderProps) => {
  const storeRef = useRef<ReturnType<typeof useStore>>()

  if (!storeRef.current) {
    storeRef.current = useStore
  }

  return <ZustandContext.Provider value={storeRef.current}>{children}</ZustandContext.Provider>
}
