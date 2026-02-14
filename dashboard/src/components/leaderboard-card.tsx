"use client"

import * as React from "react"
import { Trophy, Flame, Leaf, Target, Medal, Crown } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn, formatNumber } from "@/lib/utils"
import { leaderboardData, type LeaderboardUser } from "@/lib/mock-data"

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-white">
        <Crown className="h-4 w-4" />
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-300 to-slate-400 text-white">
        <Medal className="h-4 w-4" />
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-700 text-white">
        <Medal className="h-4 w-4" />
      </div>
    )
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold text-sm">
      {rank}
    </div>
  )
}

function LeaderboardRow({ user, isCurrentUser }: { user: LeaderboardUser; isCurrentUser: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 py-3 px-3 rounded-xl transition-colors",
        isCurrentUser
          ? "bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20"
          : "hover:bg-muted/50"
      )}
    >
      <RankBadge rank={user.rank} />
      
      <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
        <AvatarImage src={user.avatar} alt={user.username} />
        <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn("text-sm font-semibold truncate", isCurrentUser && "text-emerald-600 dark:text-emerald-400")}>
            {user.username}
          </p>
          {isCurrentUser && (
            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] px-1.5">
              You
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Target className="h-3 w-3" />
            {user.productsScanned}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Leaf className="h-3 w-3" />
            {user.carbonSaved}kg
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Flame className="h-3 w-3" />
            {user.streak}
          </span>
        </div>
      </div>

      <div className="text-right">
        <div className="flex items-center gap-1">
          <Trophy className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-sm font-bold">{formatNumber(user.score)}</span>
        </div>
        <p className="text-[10px] text-muted-foreground">points</p>
      </div>
    </div>
  )
}

export function LeaderboardCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <CardTitle>Leaderboard</CardTitle>
        </div>
        <CardDescription>Top eco-conscious shoppers this month</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px] -mx-2 px-2">
          <div className="space-y-2">
            {leaderboardData.map((user) => (
              <LeaderboardRow
                key={user.rank}
                user={user}
                isCurrentUser={user.username === "You"}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
