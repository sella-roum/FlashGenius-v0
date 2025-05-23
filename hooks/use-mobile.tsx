"use client"

import { useEffect, useState } from "react"

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // 初期チェック
    checkIsMobile()

    // リサイズイベントのリスナー
    window.addEventListener("resize", checkIsMobile)

    // クリーンアップ
    return () => {
      window.removeEventListener("resize", checkIsMobile)
    }
  }, [])

  return isMobile
}
