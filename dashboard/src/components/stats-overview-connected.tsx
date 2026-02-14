'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import { Leaf, Package, Wind, Flame, Loader2 } from "lucide-react";
import { useCurrentUser } from "@/lib/user-context";

function getScoreColor(score: number): string {
  if (score >= 80) return "hsl(142, 76%, 36%)"; // Green
  if (score >= 60) return "hsl(48, 96%, 53%)";  // Yellow
  if (score >= 40) return "hsl(25, 95%, 53%)";  // Orange
  return "hsl(0, 84%, 60%)";                     // Red
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Needs Work";
}

export function StatsOverviewConnected() {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-4 w-4 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded mb-1" />
              <div className="h-3 w-32 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = user?.stats || {
    totalScans: 0,
    averageScore: 0,
    carbonSaved: 0,
    currentStreak: 0,
  };

  const averageScore = Math.round(stats.averageScore);
  const scoreColor = getScoreColor(averageScore);
  const scoreLabel = getScoreLabel(averageScore);

  const chartData = [
    {
      name: "score",
      value: averageScore,
      fill: scoreColor,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Eco Score Card with Radial Chart */}
      <Card className="col-span-1 md:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Avg Eco-Score</CardTitle>
          <Leaf className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="h-[80px] w-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="100%"
                  barSize={10}
                  data={chartData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    background={{ fill: "hsl(var(--muted))" }}
                    dataKey="value"
                    cornerRadius={5}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div className="text-3xl font-bold" style={{ color: scoreColor }}>
                {averageScore || '—'}
              </div>
              <p className="text-xs text-muted-foreground">{scoreLabel}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Scanned */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Products Scanned</CardTitle>
          <Package className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalScans}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalScans === 0 ? 'Start scanning!' : 'Total items analyzed'}
          </p>
        </CardContent>
      </Card>

      {/* Carbon Saved */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">CO₂ Saved</CardTitle>
          <Wind className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.carbonSaved.toFixed(1)} kg</div>
          <p className="text-xs text-muted-foreground">
            {stats.carbonSaved > 0 ? 'Great impact!' : 'Make eco choices to save'}
          </p>
        </CardContent>
      </Card>

      {/* Current Streak */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          <Flame className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.currentStreak} days</div>
          <p className="text-xs text-muted-foreground">
            {stats.currentStreak > 0 ? 'Keep it up!' : 'Scan daily to start streak'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
