'use client';

import { Trophy, Sparkles, Lock, Check, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useCurrentUser } from "@/lib/user-context"
import { useUserAchievements } from "@/lib/hooks"
import { LoginCard } from "@/components/login-card"
import { format } from "date-fns"

const rarityColors: Record<string, string> = {
  common: "border-slate-400 bg-slate-400/10",
  rare: "border-blue-400 bg-blue-400/10",
  epic: "border-purple-400 bg-purple-400/10",
  legendary: "border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/30",
}

const rarityBadgeColors: Record<string, string> = {
  common: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  rare: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  epic: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  legendary: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
}

export default function AchievementsPage() {
  const { userId, isLoading: userLoading } = useCurrentUser();
  const { data, isLoading, error } = useUserAchievements(userId);

  if (!userId && !userLoading) {
    return <LoginCard />;
  }

  if (isLoading || userLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-amber-500" />
          <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-amber-500" />
          <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
        </div>
        <p className="text-red-500">Failed to load achievements</p>
      </div>
    );
  }

  const { achievements, summary } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-amber-500" />
          <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
        </div>
        <p className="text-muted-foreground">
          Track your sustainable shopping milestones and unlock badges
        </p>
      </div>

      {/* Progress Overview */}
      <Card className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Achievement Progress</h3>
              <p className="text-sm text-muted-foreground">
                {summary.earned} of {summary.total} achievements unlocked
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold">{summary.totalXP} XP</span>
            </div>
          </div>
          <Progress value={(summary.earned / summary.total) * 100} className="h-3" />
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {achievements.map((achievement) => (
          <Card
            key={achievement.id}
            className={cn(
              "transition-all hover:shadow-lg",
              achievement.earned
                ? "bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/30"
                : rarityColors[achievement.rarity]
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-xl text-3xl",
                    achievement.earned ? "bg-emerald-500/20" : "bg-muted"
                  )}
                >
                  {achievement.earned ? (
                    achievement.icon
                  ) : (
                    <Lock className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {achievement.earned && (
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]">
                      <Check className="h-3 w-3 mr-1" />
                      Unlocked
                    </Badge>
                  )}
                  <Badge className={cn("text-[10px] capitalize", rarityBadgeColors[achievement.rarity])}>
                    {achievement.rarity}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-base mb-1">{achievement.name}</CardTitle>
              <CardDescription className="text-xs">{achievement.description}</CardDescription>
              
              {achievement.earned && achievement.unlockedAt && (
                <p className="text-xs text-emerald-600 mt-2">
                  Unlocked {format(new Date(achievement.unlockedAt), 'MMM d, yyyy')}
                </p>
              )}
              
              {!achievement.earned && achievement.progress > 0 && (
                <div className="mt-4 space-y-2">
                  <Progress value={achievement.progress} className="h-2" />
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Progress</span>
                    <span className="font-medium">{achievement.progress}%</span>
                  </div>
                </div>
              )}
              
              <div className="mt-3 text-xs text-amber-600 font-medium">
                +{achievement.xpReward} XP
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
