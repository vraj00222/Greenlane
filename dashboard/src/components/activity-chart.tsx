"use client"

import * as React from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { weeklyActivityData, monthlyTrendData } from "@/lib/mock-data"

const weeklyChartConfig = {
  productsScanned: {
    label: "Products",
    color: "hsl(142, 76%, 36%)",
  },
  ecoChoices: {
    label: "Eco Choices",
    color: "hsl(199, 89%, 48%)",
  },
} satisfies ChartConfig

const carbonChartConfig = {
  carbonSaved: {
    label: "CO₂ Saved",
    color: "hsl(142, 76%, 36%)",
  },
} satisfies ChartConfig

const trendChartConfig = {
  score: {
    label: "Eco Score",
    color: "hsl(142, 76%, 36%)",
  },
} satisfies ChartConfig

export function ActivityChart() {
  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Activity Overview</CardTitle>
        <CardDescription>Your shopping activity and eco-choices this week</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="activity" className="space-y-4">
          <TabsList className="grid w-full max-w-[400px] grid-cols-3">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="carbon">Carbon</TabsTrigger>
            <TabsTrigger value="trend">Trend</TabsTrigger>
          </TabsList>
          
          <TabsContent value="activity" className="space-y-4">
            <ChartContainer config={weeklyChartConfig} className="h-[300px] w-full">
              <BarChart data={weeklyActivityData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                />
                <Bar
                  dataKey="productsScanned"
                  fill="var(--color-productsScanned)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="ecoChoices"
                  fill="var(--color-ecoChoices)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="carbon" className="space-y-4">
            <ChartContainer config={carbonChartConfig} className="h-[300px] w-full">
              <AreaChart data={weeklyActivityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                  tickFormatter={(value) => `${value}kg`}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={{ stroke: "hsl(var(--muted))" }}
                />
                <defs>
                  <linearGradient id="carbonGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-carbonSaved)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--color-carbonSaved)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="carbonSaved"
                  stroke="var(--color-carbonSaved)"
                  strokeWidth={2}
                  fill="url(#carbonGradient)"
                />
              </AreaChart>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="trend" className="space-y-4">
            <ChartContainer config={trendChartConfig} className="h-[300px] w-full">
              <AreaChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                  domain={[0, 100]}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={{ stroke: "hsl(var(--muted))" }}
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-score)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-score)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="var(--color-score)"
                  strokeWidth={2}
                  fill="url(#scoreGradient)"
                />
              </AreaChart>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
