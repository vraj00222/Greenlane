"use client"

import * as React from "react"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { categoryBreakdown } from "@/lib/mock-data"

const radarChartConfig = {
  score: {
    label: "Eco Score",
    color: "hsl(142, 76%, 36%)",
  },
} satisfies ChartConfig

export function CategoryRadar() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Breakdown</CardTitle>
        <CardDescription>Your eco-scores across different product categories</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={radarChartConfig} className="mx-auto aspect-square max-h-[300px]">
          <RadarChart data={categoryBreakdown}>
            <PolarGrid className="stroke-muted" />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              cursor={false}
            />
            <Radar
              name="Eco Score"
              dataKey="score"
              stroke="var(--color-score)"
              fill="var(--color-score)"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
