"use client"

import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import { ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { cn, getScoreColor, getScoreBgColor } from "@/lib/utils"
import { recentProducts, type ScannedProduct } from "@/lib/mock-data"

function ProductItem({ product }: { product: ScannedProduct }) {
  const scoreColor = getScoreColor(product.score)
  const scoreBg = getScoreBgColor(product.score)

  return (
    <div className="flex items-center gap-4 py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
      <Avatar className="h-12 w-12 rounded-lg border">
        <AvatarImage src={product.image} alt={product.title} className="object-cover" />
        <AvatarFallback className="rounded-lg bg-muted">
          {product.title.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{product.title}</p>
          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{product.brand}</span>
          <span className="text-xs text-muted-foreground">•</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {product.category}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(product.timestamp, { addSuffix: true })}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1">
        <div className={cn("flex items-center justify-center rounded-full px-2.5 py-1", scoreBg)}>
          <span className={cn("text-sm font-bold", scoreColor)}>{product.score}</span>
        </div>
        <div className="flex items-center gap-1">
          {product.carbonSaved > 0 ? (
            <>
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span className="text-[10px] text-emerald-500 font-medium">
                -{product.carbonSaved}kg CO₂
              </span>
            </>
          ) : product.carbonSaved < 0 ? (
            <>
              <TrendingDown className="h-3 w-3 text-red-500" />
              <span className="text-[10px] text-red-500 font-medium">
                +{Math.abs(product.carbonSaved)}kg CO₂
              </span>
            </>
          ) : (
            <Minus className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      </div>
    </div>
  )
}

export function RecentActivity() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Scans</CardTitle>
          <CardDescription>Your latest product analyses</CardDescription>
        </div>
        <Button variant="ghost" size="sm" className="text-xs">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[380px] -mx-2">
          <div className="space-y-1 px-2">
            {recentProducts.map((product) => (
              <ProductItem key={product.id} product={product} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
