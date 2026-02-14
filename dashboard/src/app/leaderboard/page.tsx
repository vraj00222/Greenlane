'use client';

import { Trophy, Medal, Crown, Flame, Leaf, Target, Users, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn, formatNumber } from "@/lib/utils"
import { useCurrentUser } from "@/lib/user-context"
import { useLeaderboard } from "@/lib/hooks"
import { LoginCard } from "@/components/login-card"

function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-lg shadow-amber-500/30">
        <Crown className="h-6 w-6" />
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-lg shadow-slate-500/30">
        <Medal className="h-6 w-6" />
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-700/30">
        <Medal className="h-6 w-6" />
      </div>
    )
  }
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold text-lg">
      {rank}
    </div>
  )
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function LeaderboardPage() {
  const { user, userId, isLoading: userLoading } = useCurrentUser();
  const { data: leaderboard, isLoading, error } = useLeaderboard(50);

  if (!userId && !userLoading) {
    return <LoginCard />;
  }

  if (isLoading || userLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-amber-500" />
          <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Calculate user's rank
  const userRankIndex = leaderboard?.findIndex(e => e.id === userId) ?? -1;
  const userRank = userRankIndex >= 0 ? userRankIndex + 1 : null;
  const totalUsers = leaderboard?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-amber-500" />
          <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
        </div>
        <p className="text-muted-foreground">
          See how you rank against other eco-conscious shoppers
        </p>
      </div>

      {/* Your Rank Summary */}
      {user && (
        <Card className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-4 border-emerald-500/30 shadow-lg">
                  <AvatarImage src={user.avatar} alt={user.displayName} />
                  <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold">Your Ranking</h3>
                    {userRank && <Badge className="bg-emerald-500 text-white">#{userRank}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {userRank ? (
                      <>Top {Math.round((userRank / totalUsers) * 100)}% of {totalUsers.toLocaleString()} users</>
                    ) : (
                      'Start scanning to appear on the leaderboard'
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Leaf className="h-4 w-4 text-emerald-500" />
                    <span className="text-2xl font-bold">{Math.round(user.stats.averageScore)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Avg Score</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="text-2xl font-bold">{user.stats.currentStreak}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Target className="h-4 w-4 text-blue-500" />
                    <span className="text-2xl font-bold">{user.stats.carbonSaved.toFixed(1)}kg</span>
                  </div>
                  <p className="text-xs text-muted-foreground">CO₂ Saved</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <CardTitle>Global Rankings</CardTitle>
          </div>
          <CardDescription>
            {totalUsers > 0 ? 'Top eco-conscious shoppers this month' : 'Be the first to join the leaderboard!'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leaderboard && leaderboard.length > 0 ? (
            <div className="space-y-4">
              {leaderboard.map((entry) => {
                const isCurrentUser = entry.id === userId
                
                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "flex items-center gap-4 py-4 px-4 rounded-xl transition-all",
                      isCurrentUser
                        ? "bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-2 border-emerald-500/30 shadow-md"
                        : "border hover:bg-muted/50 hover:shadow-sm",
                      entry.rank <= 3 && !isCurrentUser && "border-amber-500/20"
                    )}
                  >
                    <RankDisplay rank={entry.rank} />
                    
                    <Avatar className={cn(
                      "h-12 w-12 border-2",
                      isCurrentUser ? "border-emerald-500" : entry.rank <= 3 ? "border-amber-500/50" : "border-border"
                    )}>
                      <AvatarImage src={entry.avatar} alt={entry.displayName} />
                      <AvatarFallback>{getInitials(entry.displayName)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "font-semibold",
                          isCurrentUser && "text-emerald-600 dark:text-emerald-400"
                        )}>
                          {entry.displayName}
                        </p>
                        {isCurrentUser && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] px-1.5">
                            You
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Target className="h-3.5 w-3.5" />
                          {entry.stats.totalScans} scans
                        </span>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Leaf className="h-3.5 w-3.5" />
                          {entry.stats.carbonSaved.toFixed(1)}kg saved
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1.5">
                        <Leaf className="h-5 w-5 text-emerald-500" />
                        <span className="text-xl font-bold">{Math.round(entry.stats.averageScore)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">avg score</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No users on the leaderboard yet. Start scanning to be the first!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
