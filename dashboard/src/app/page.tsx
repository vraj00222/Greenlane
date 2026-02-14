'use client';

import { StatsOverviewConnected } from "@/components/stats-overview-connected"
import { ActivityChartConnected } from "@/components/activity-chart-connected"
import { RecentActivityConnected } from "@/components/recent-activity-connected"
import { AchievementsConnected } from "@/components/achievements-connected"
import { LeaderboardConnected } from "@/components/leaderboard-connected"
import { LoginCard } from "@/components/login-card"
import { useCurrentUser } from "@/lib/user-context"
import { useLeaderboard } from "@/lib/hooks"

export default function DashboardPage() {
  const { user, userId, isLoading } = useCurrentUser();
  const { data: leaderboard } = useLeaderboard(100);

  // Show login if no user
  if (!userId && !isLoading) {
    return <LoginCard />;
  }

  // Calculate user rank
  const userRank = leaderboard?.findIndex(e => e.id === userId) ?? -1;
  const rank = userRank >= 0 ? userRank + 1 : null;
  const totalUsers = leaderboard?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}! 🌱
        </h1>
        <p className="text-muted-foreground">
          {rank ? (
            <>
              You&apos;re ranked <span className="font-semibold text-emerald-600 dark:text-emerald-400">#{rank}</span> out of{" "}
              <span className="font-medium">{totalUsers.toLocaleString()}</span> eco-conscious shoppers.
              Keep up the great work!
            </>
          ) : (
            <>
              Track your sustainable shopping journey and compete with other eco-conscious shoppers.
            </>
          )}
        </p>
      </div>

      {/* Stats Overview */}
      <StatsOverviewConnected />

      {/* Charts and Activity Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity Chart - Takes 2 columns */}
        <div className="lg:col-span-2">
          <ActivityChartConnected />
        </div>
        
        {/* Recent Activity */}
        <RecentActivityConnected />
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Achievements */}
        <AchievementsConnected />
        
        {/* Leaderboard */}
        <LeaderboardConnected />
      </div>
    </div>
  )
}
