"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Leaf,
  LayoutDashboard,
  History,
  Trophy,
  Users,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "History", href: "/history", icon: History },
  { name: "Achievements", href: "/achievements", icon: Trophy },
  { name: "Leaderboard", href: "/leaderboard", icon: Users },
]

const secondaryNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Help", href: "/help", icon: HelpCircle },
]

interface AppSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white">
              <Leaf className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">
                  GreenLane
                </span>
                <span className="text-[10px] text-muted-foreground -mt-1">
                  Shop Sustainably
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const NavItem = (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-emerald-500")} />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              )

              if (collapsed) {
                return (
                  <Tooltip key={item.name} delayDuration={0}>
                    <TooltipTrigger asChild>{NavItem}</TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.name}
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return NavItem
            })}
          </div>

          {/* Divider */}
          <div className="my-4 border-t" />

          {/* Secondary Navigation */}
          <div className="space-y-1">
            {secondaryNavigation.map((item) => {
              const NavItem = (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              )

              if (collapsed) {
                return (
                  <Tooltip key={item.name} delayDuration={0}>
                    <TooltipTrigger asChild>{NavItem}</TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.name}
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return NavItem
            })}
          </div>
        </nav>

        {/* Pro Banner */}
        {!collapsed && (
          <div className="p-3">
            <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 p-4 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  GreenLane Pro
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Unlock advanced analytics and exclusive badges
              </p>
              <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                Upgrade Now
              </Button>
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <div className="border-t p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={onToggle}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  )
}
