'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Lock, Sparkles } from "lucide-react";
import { useCurrentUser } from "@/lib/user-context";
import { useUserAchievements } from "@/lib/hooks";
import { format } from "date-fns";

const rarityColors: Record<string, string> = {
  common: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  rare: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  epic: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  legendary: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

export function AchievementsConnected({ showAll = false }: { showAll?: boolean }) {
  const { userId } = useCurrentUser();
  const { data, isLoading, error } = useUserAchievements(userId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Achievements
          </CardTitle>
          <CardDescription>Loading achievements...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/2 bg-muted rounded" />
                  <div className="h-3 w-3/4 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Achievements
          </CardTitle>
          <CardDescription className="text-red-500">Failed to load achievements</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const achievements = showAll ? data.achievements : data.achievements.slice(0, 5);
  const { summary } = data;

  return (
    <Card className={showAll ? "" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Achievements
            </CardTitle>
            <CardDescription>
              {summary.earned} of {summary.total} unlocked • {summary.totalXP} XP earned
            </CardDescription>
          </div>
          {summary.earned > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              {summary.totalXP} XP
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className={showAll ? "h-[500px]" : "h-[280px]"}>
          <div className="space-y-4 pr-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                  achievement.earned
                    ? "bg-card"
                    : "bg-muted/30 opacity-75"
                }`}
              >
                {/* Icon */}
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center text-xl ${
                    achievement.earned
                      ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                      : "bg-muted"
                  }`}
                >
                  {achievement.earned ? (
                    achievement.icon
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{achievement.name}</p>
                    <Badge variant="outline" className={rarityColors[achievement.rarity]}>
                      {achievement.rarity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  
                  {/* Progress bar for unearned */}
                  {!achievement.earned && achievement.progress > 0 && (
                    <div className="mt-2">
                      <Progress value={achievement.progress} className="h-1" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {achievement.progress}% complete
                      </p>
                    </div>
                  )}
                  
                  {/* Unlock date for earned */}
                  {achievement.earned && achievement.unlockedAt && (
                    <p className="text-xs text-green-600 mt-1">
                      Unlocked {format(new Date(achievement.unlockedAt), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>

                {/* XP Reward */}
                <div className="text-right">
                  <span className="text-sm font-medium text-amber-600">
                    +{achievement.xpReward} XP
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
