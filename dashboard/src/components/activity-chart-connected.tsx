'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity } from "lucide-react";
import { useCurrentUser } from "@/lib/user-context";
import { useWeeklyActivity } from "@/lib/hooks";
import { format, parseISO, subDays } from "date-fns";

// Generate last 7 days for empty state
function generateEmptyWeek() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    days.push({
      date: format(date, 'yyyy-MM-dd'),
      day: format(date, 'EEE'),
      scans: 0,
      avgScore: 0,
    });
  }
  return days;
}

export function ActivityChartConnected() {
  const { userId } = useCurrentUser();
  const { data: weeklyData, isLoading, error } = useWeeklyActivity(userId);

  // Process data for charts
  const chartData = weeklyData && weeklyData.length > 0
    ? weeklyData.map(d => ({
        ...d,
        day: format(parseISO(d.date), 'EEE'),
      }))
    : generateEmptyWeek();

  // Fill in missing days
  const last7Days = generateEmptyWeek();
  const dataMap = new Map(chartData.map(d => [d.date, d]));
  const filledData = last7Days.map(day => dataMap.get(day.date) || day);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Weekly Activity
          </CardTitle>
          <CardDescription>Loading your activity data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center">
            <div className="animate-pulse bg-muted rounded w-full h-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalScans = filledData.reduce((sum, d) => sum + d.scans, 0);
  const avgScore = totalScans > 0
    ? Math.round(filledData.reduce((sum, d) => sum + (d.avgScore * d.scans), 0) / totalScans)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Weekly Activity
        </CardTitle>
        <CardDescription>
          {totalScans > 0
            ? `${totalScans} scans this week • ${avgScore} avg score`
            : 'No activity this week. Start scanning to see your progress!'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="scans" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scans">Scans</TabsTrigger>
            <TabsTrigger value="scores">Scores</TabsTrigger>
          </TabsList>

          <TabsContent value="scans" className="space-y-4">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filledData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar
                    dataKey="scans"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    name="Scans"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="scores" className="space-y-4">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filledData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="avgScore"
                    stroke="hsl(142, 76%, 36%)"
                    fill="hsl(142, 76%, 36%, 0.2)"
                    name="Avg Score"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
