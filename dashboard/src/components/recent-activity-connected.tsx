'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, formatDistanceToNow } from "date-fns";
import { Package, ExternalLink } from "lucide-react";
import { useCurrentUser } from "@/lib/user-context";
import { useUserScans } from "@/lib/hooks";

function getScoreColor(score: number): string {
  if (score >= 80) return "bg-green-500/10 text-green-600 border-green-500/20";
  if (score >= 60) return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
  if (score >= 40) return "bg-orange-500/10 text-orange-600 border-orange-500/20";
  return "bg-red-500/10 text-red-600 border-red-500/20";
}

export function RecentActivityConnected() {
  const { userId } = useCurrentUser();
  const { data: scans, isLoading, error } = useUserScans(userId, 10);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Loading your scan history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-12 w-12 rounded bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
                <div className="h-6 w-12 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription className="text-red-500">Failed to load activity</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const hasScans = scans && scans.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          {hasScans ? 'Your latest product scans' : 'No scans yet. Use the extension to get started!'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasScans ? (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {scans.map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  {/* Product Image */}
                  <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0">
                    {scan.product.imageUrl ? (
                      <img
                        src={scan.product.imageUrl}
                        alt={scan.product.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {scan.product.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {scan.product.brand} • {formatDistanceToNow(new Date(scan.scannedAt), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Score Badge */}
                  <Badge variant="outline" className={getScoreColor(scan.greenScore)}>
                    {scan.greenScore}
                  </Badge>

                  {/* External Link */}
                  {scan.product.url && (
                    <a
                      href={scan.product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="h-[300px] flex flex-col items-center justify-center text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Install the GreenLane extension and start scanning products to see your activity here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
