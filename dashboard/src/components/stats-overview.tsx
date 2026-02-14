"use client"

import * as React from "react"
import { TrendingUp, TrendingDown, Leaf, Zap, Target, Flame } from "lucide-react"
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { cn, getScoreColor, formatNumber } from "@/lib/utils"
import { userStats } from "@/lib/mock-data"

const ecoScoreConfig = {
  score: {
    label: "Eco Score",
    color: "hsl(var(--chart-1))",
  },
  remaining: {
    label: "Remaining",
    color: "hsl(var(--muted))",
  },
} satisfies ChartConfig

interface StatCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ElementType
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
  iconClassName?: string
}

function StatCard({ title, value, description, icon: Icon, trend, className, iconClassName }: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("rounded-lg p-2", iconClassName)}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-1 mt-1">
          {trend && (
            <span
              className={cn(
                "flex items-center text-xs font-medium",
                trend.isPositive ? "text-emerald-500" : "text-red-500"
              )}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3 mr-0.5" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-0.5" />
              )}
              {trend.value}%
            </span>
          )}
          <span className="text-xs text-muted-foreground">{description}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function StatsOverview() {
  const ecoScoreData = [
    {
      score: userStats.averageEcoScore,
      remaining: 100 - userStats.averageEcoScore,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Eco Score Card with Radial Chart */}
      <Card className="md:col-span-2 lg:col-span-1 overflow-hidden">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">Average Eco Score</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center pb-4">
          <ChartContainer config={ecoScoreConfig} className="mx-auto aspect-square h-[160px]">
            <RadialBarChart
              data={ecoScoreData}
              startAngle={90}
              endAngle={90 + (360 * userStats.averageEcoScore) / 100}
              innerRadius={60}
              outerRadius={80}
            >
              <RadialBar
                dataKey="score"
                background={{ fill: "hsl(var(--muted))" }}
                cornerRadius={10}
                fill={
                  userStats.averageEcoScore >= 70
                    ? "hsl(142, 76%, 36%)"
                    : userStats.averageEcoScore >= 40
                    ? "hsl(45, 93%, 47%)"
                    : "hsl(0, 84%, 60%)"
                }
              />
              <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className={cn(
                              "text-3xl font-bold fill-current",
                              getScoreColor(userStats.averageEcoScore)
                            )}
                          >
                            {userStats.averageEcoScore}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 20}
                            className="fill-muted-foreground text-xs"
                          >
                            /100
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </PolarRadiusAxis>
            </RadialBarChart>
          </ChartContainer>
        </CardContent>
        <div className="border-t bg-muted/30 px-4 py-2 flex items-center justify-center gap-1">
          <TrendingUp className="h-3 w-3 text-emerald-500" />
          <span className="text-xs text-emerald-500 font-medium">+8%</span>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      </Card>

      {/* Products Scanned */}
      <StatCard
        title="Products Scanned"
        value={formatNumber(userStats.totalProductsScanned)}
        description="Total this month"
        icon={Target}
        trend={{ value: 23, isPositive: true }}
        iconClassName="bg-blue-500/10 text-blue-500"
      />

      {/* Carbon Saved */}
      <StatCard
        title="Carbon Saved"
        value={`${userStats.carbonSaved}kg`}
        description="CO₂ equivalent"
        icon={Leaf}
        trend={{ value: 15, isPositive: true }}
        iconClassName="bg-emerald-500/10 text-emerald-500"
      />

      {/* Current Streak */}
      <StatCard
        title="Current Streak"
        value={`${userStats.currentStreak} days`}
        description={`Best: ${userStats.longestStreak} days`}
        icon={Flame}
        trend={{ value: 2, isPositive: true }}
        iconClassName="bg-orange-500/10 text-orange-500"
      />
    </div>
  )
}
