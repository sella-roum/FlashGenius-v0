"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { NAV_LINKS } from "@/lib/constants"
import { LayoutDashboard, PlusCircle, Library } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const iconMap = {
  LayoutDashboard: LayoutDashboard,
  PlusCircle: PlusCircle,
  Library: Library,
}

export const Header = () => {
  const pathname = usePathname()
  const isMobile = useIsMobile()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="font-bold text-xl">FlashGenius</span>
          </Link>
        </div>
        <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
          <TooltipProvider>
            {NAV_LINKS.map((link) => {
              const Icon = iconMap[link.icon as keyof typeof iconMap]
              const isActive = pathname === link.href

              return (
                <Tooltip key={link.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={link.href}
                      className={cn(
                        "flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary",
                        isActive ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {!isMobile && <span>{link.label}</span>}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{link.label}</p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </TooltipProvider>
        </nav>
      </div>
    </header>
  )
}
