"use client"

import * as React from "react"
import { Bell, Search, Moon, Sun, User, Check, X } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCurrentUser } from "@/lib/user-context"
import { useNotifications, useUserAchievements } from "@/lib/hooks"

export function AppHeader() {
  const { theme, setTheme } = useTheme()
  const { user, userId } = useCurrentUser()
  const { data: notificationData, mutate: mutateNotifications } = useNotifications(userId)
  const { data: achievementData } = useUserAchievements(userId)

  const notifications = notificationData?.notifications || []
  const unreadCount = notificationData?.unreadCount || 0
  const totalXP = (achievementData?.summary?.totalXP || 0) + (user?.stats?.totalScans || 0) * 10
  const level = Math.floor(totalXP / 100) + 1

  const markAsRead = async (notificationId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      await fetch(`${apiUrl}/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      })
      mutateNotifications()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!userId) return
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      await fetch(`${apiUrl}/api/notifications/user/${userId}/read-all`, {
        method: 'PATCH',
      })
      mutateNotifications()
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative w-64 lg:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products, brands..."
            className="pl-9 bg-muted/50"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle theme</TooltipContent>
        </Tooltip>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-emerald-500 text-[10px]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={markAllAsRead}
                >
                  Mark all read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="h-[300px]">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification: any) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex items-start gap-3 p-3 cursor-pointer"
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <span className="text-xl flex-shrink-0">{notification.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${notification.read ? 'text-muted-foreground' : ''}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1" />
                    )}
                  </DropdownMenuItem>
                ))
              )}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <Link href="/settings" className="flex items-center gap-3 pl-3 border-l ml-2 hover:opacity-80 transition-opacity">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium">{user?.displayName || 'Guest'}</p>
            <p className="text-xs text-muted-foreground">Level {level} • {totalXP.toLocaleString()} XP</p>
          </div>
          <Avatar className="h-9 w-9 border-2 border-emerald-500/30">
            <AvatarImage 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || 'guest'}`} 
              alt={user?.displayName || 'User'} 
            />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  )
}
