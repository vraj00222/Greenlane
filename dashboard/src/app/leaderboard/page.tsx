import { leaderboardData, userStats } from "@/lib/mock-data"
import { Trophy, Medal, Crown, Flame, Leaf, Target, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn, formatNumber } from "@/lib/utils"

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

export default function LeaderboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-amber-500" />
          <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
        </div>
        <p className="text-muted-foreground">
          See how you rank against other eco-conscious shoppers worldwide
        </p>
      </div>

      {/* Your Rank Summary */}
      <Card className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-4 border-emerald-500/30 shadow-lg">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=you" alt="You" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold">Your Ranking</h3>
                  <Badge className="bg-emerald-500 text-white">#{userStats.rank}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Top {Math.round((userStats.rank / userStats.totalUsers) * 100)}% of {userStats.totalUsers.toLocaleString()} users
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <span className="text-2xl font-bold">{formatNumber(userStats.totalXp)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Total Points</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-2xl font-bold">{userStats.currentStreak}</span>
                </div>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Leaf className="h-4 w-4 text-emerald-500" />
                  <span className="text-2xl font-bold">{userStats.carbonSaved}kg</span>
                </div>
                <p className="text-xs text-muted-foreground">CO₂ Saved</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <CardTitle>Global Rankings</CardTitle>
          </div>
          <CardDescription>Top eco-conscious shoppers this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaderboardData.map((user) => {
              const isCurrentUser = user.username === "You"
              
              return (
                <div
                  key={user.rank}
                  className={cn(
                    "flex items-center gap-4 py-4 px-4 rounded-xl transition-all",
                    isCurrentUser
                      ? "bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-2 border-emerald-500/30 shadow-md"
                      : "border hover:bg-muted/50 hover:shadow-sm",
                    user.rank <= 3 && !isCurrentUser && "border-amber-500/20"
                  )}
                >
                  <RankDisplay rank={user.rank} />
                  
                  <Avatar className={cn(
                    "h-12 w-12 border-2",
                    isCurrentUser ? "border-emerald-500" : user.rank <= 3 ? "border-amber-500/50" : "border-border"
                  )}>
                    <AvatarImage src={user.avatar} alt={user.username} />
                    <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "font-semibold",
                        isCurrentUser && "text-emerald-600 dark:text-emerald-400"
                      )}>
                        {user.username}
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
                        {user.productsScanned} scans
                      </span>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Leaf className="h-3.5 w-3.5" />
                        {user.carbonSaved}kg saved
                      </span>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Flame className="h-3.5 w-3.5" />
                        {user.streak} day streak
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1.5">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      <span className="text-xl font-bold">{formatNumber(user.score)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
