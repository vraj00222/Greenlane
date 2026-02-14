"use client"

import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import { Lock, Sparkles, Check } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { achievements, type Achievement } from "@/lib/mock-data"

const rarityColors = {
  common: "border-slate-400 bg-slate-400/10",
  rare: "border-blue-400 bg-blue-400/10",
  epic: "border-purple-400 bg-purple-400/10",
  legendary: "border-amber-400 bg-amber-400/10",
}

const rarityBadgeColors = {
  common: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  rare: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  epic: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  legendary: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
}

function AchievementItem({ achievement }: { achievement: Achievement }) {
  const progressPercent = (achievement.progress / achievement.maxProgress) * 100

  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 rounded-xl border transition-all",
        achievement.unlocked
          ? "bg-gradient-to-r from-emerald-500/5 to-green-500/5 border-emerald-500/30"
          : rarityColors[achievement.rarity]
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl text-2xl",
          achievement.unlocked ? "bg-emerald-500/20" : "bg-muted"
        )}
      >
        {achievement.unlocked ? (
          achievement.icon
        ) : (
          <Lock className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-sm font-semibold">{achievement.name}</h4>
          {achievement.unlocked && (
            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]">
              <Check className="h-3 w-3 mr-1" />
              Unlocked
            </Badge>
          )}
          <Badge className={cn("text-[10px] capitalize", rarityBadgeColors[achievement.rarity])}>
            {achievement.rarity}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
        
        {!achievement.unlocked && (
          <div className="mt-3 space-y-1.5">
            <Progress value={progressPercent} className="h-2" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Progress</span>
              <span className="font-medium">
                {typeof achievement.progress === 'number' && achievement.progress % 1 !== 0
                  ? achievement.progress.toFixed(1)
                  : achievement.progress}
                /{achievement.maxProgress}
              </span>
            </div>
          </div>
        )}

        {achievement.unlocked && achievement.unlockedAt && (
          <p className="text-[10px] text-muted-foreground mt-2">
            Unlocked {formatDistanceToNow(achievement.unlockedAt, { addSuffix: true })}
          </p>
        )}
      </div>
    </div>
  )
}

export function AchievementsCard() {
  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const totalCount = achievements.length

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>Achievements</CardTitle>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <CardDescription>
            {unlockedCount} of {totalCount} unlocked
          </CardDescription>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{Math.round((unlockedCount / totalCount) * 100)}%</div>
          <p className="text-xs text-muted-foreground">Completion</p>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px] -mx-2 px-2">
          <div className="space-y-3">
            {achievements.map((achievement) => (
              <AchievementItem key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
