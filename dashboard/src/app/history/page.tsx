import { recentProducts } from "@/lib/mock-data"
import { formatDistanceToNow } from "date-fns"
import { History as HistoryIcon, ExternalLink } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn, getScoreColor, getScoreBgColor } from "@/lib/utils"

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <HistoryIcon className="h-6 w-6 text-emerald-500" />
          <h1 className="text-2xl font-bold tracking-tight">Scan History</h1>
        </div>
        <p className="text-muted-foreground">
          View all products you&apos;ve scanned with their sustainability scores
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Scanned Products</CardTitle>
          <CardDescription>Your complete scanning history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Mock more items by repeating */}
            {[...recentProducts, ...recentProducts].map((product, index) => (
              <div
                key={`${product.id}-${index}`}
                className="flex items-center gap-4 py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group border"
              >
                <Avatar className="h-14 w-14 rounded-lg border">
                  <AvatarImage src={product.image} alt={product.title} className="object-cover" />
                  <AvatarFallback className="rounded-lg bg-muted">
                    {product.title.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{product.title}</p>
                    <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm text-muted-foreground">{product.brand}</span>
                    <span className="text-muted-foreground">•</span>
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                      {product.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(product.timestamp, { addSuffix: true })}
                  </p>
                </div>

                <div className={cn("flex items-center justify-center rounded-full px-3 py-1.5", getScoreBgColor(product.score))}>
                  <span className={cn("text-lg font-bold", getScoreColor(product.score))}>{product.score}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
