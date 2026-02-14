import { StatsOverview } from "@/components/stats-overview"
import { ActivityChart } from "@/components/activity-chart"
import { RecentActivity } from "@/components/recent-activity"
import { AchievementsCard } from "@/components/achievements-card"
import { LeaderboardCard } from "@/components/leaderboard-card"
import { CategoryRadar } from "@/components/category-radar"
import { userStats } from "@/lib/mock-data"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back! 🌱
        </h1>
        <p className="text-muted-foreground">
          You&apos;re ranked <span className="font-semibold text-emerald-600 dark:text-emerald-400">#{userStats.rank}</span> out of{" "}
          <span className="font-medium">{userStats.totalUsers.toLocaleString()}</span> eco-conscious shoppers.
          Keep up the great work!
        </p>
      </div>

      {/* Stats Overview */}
      <StatsOverview />

      {/* Charts and Activity Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity Chart - Takes 2 columns */}
        <ActivityChart />
        
        {/* Recent Activity */}
        <RecentActivity />
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Category Radar */}
        <CategoryRadar />
        
        {/* Achievements */}
        <AchievementsCard />
        
        {/* Leaderboard */}
        <LeaderboardCard />
      </div>
    </div>
  )
}
