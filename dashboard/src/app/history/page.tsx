'use client';

import { formatDistanceToNow } from "date-fns"
import { History as HistoryIcon, ExternalLink, Loader2, Package, CheckCircle2, XCircle, HelpCircle, ThumbsUp, ThumbsDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn, getScoreColor, getScoreBgColor } from "@/lib/utils"
import { useCurrentUser } from "@/lib/user-context"
import { useUserScans } from "@/lib/hooks"
import { updateScanChoice } from "@/lib/api"
import { LoginCard } from "@/components/login-card"
import { useState } from "react"
import type { Scan } from "@/lib/api"

function ChoiceIcon({ choice }: { choice?: string | null }) {
  if (choice === 'purchased') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (choice === 'skipped') return <XCircle className="h-4 w-4 text-red-500" />;
  return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
}

function ChoiceButtons({ scan, onUpdate }: { scan: Scan; onUpdate: (choice: 'purchased' | 'skipped') => void }) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleChoice = async (choice: 'purchased' | 'skipped') => {
    setLoading(choice);
    try {
      await updateScanChoice(scan.id, choice);
      onUpdate(choice);
    } catch (e) {
      console.error('Failed to update choice:', e);
    } finally {
      setLoading(null);
    }
  };

  if (scan.userChoice) {
    return (
      <Badge 
        variant={scan.userChoice === 'purchased' ? 'default' : 'secondary'}
        className={scan.userChoice === 'purchased' ? 'bg-green-500' : ''}
      >
        {scan.userChoice === 'purchased' ? 'Purchased' : 'Skipped'}
      </Badge>
    );
  }

  return (
    <div className="flex gap-1">
      <Button 
        size="sm" 
        variant="outline" 
        className="h-7 px-2"
        onClick={() => handleChoice('purchased')}
        disabled={loading !== null}
      >
        {loading === 'purchased' ? <Loader2 className="h-3 w-3 animate-spin" /> : <ThumbsUp className="h-3 w-3" />}
      </Button>
      <Button 
        size="sm" 
        variant="outline" 
        className="h-7 px-2"
        onClick={() => handleChoice('skipped')}
        disabled={loading !== null}
      >
        {loading === 'skipped' ? <Loader2 className="h-3 w-3 animate-spin" /> : <ThumbsDown className="h-3 w-3" />}
      </Button>
    </div>
  );
}

export default function HistoryPage() {
  const { userId, isLoading: userLoading } = useCurrentUser();
  const { data: scans, isLoading, mutate } = useUserScans(userId || '');
  const [localScans, setLocalScans] = useState<Scan[]>([]);

  // Update local scans when API data changes
  const displayScans = localScans.length > 0 ? localScans : (scans || []);

  const handleChoiceUpdate = (scanId: string, choice: 'purchased' | 'skipped') => {
    const updated = displayScans.map(s => 
      s.id === scanId ? { ...s, userChoice: choice as Scan['userChoice'] } : s
    );
    setLocalScans(updated);
    mutate();
  };

  if (!userId && !userLoading) {
    return <LoginCard />;
  }

  if (isLoading || userLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <HistoryIcon className="h-6 w-6 text-emerald-500" />
          <h1 className="text-2xl font-bold tracking-tight">Scan History</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

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
          <CardDescription>
            {displayScans.length > 0 
              ? `${displayScans.length} products scanned` 
              : 'Start scanning products to build your history'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayScans.length > 0 ? (
            <div className="space-y-4">
              {displayScans.map((scan) => {
                const product = scan.product;
                const score = scan.greenScore;
                
                return (
                  <div
                    key={scan.id}
                    className="flex items-center gap-4 py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors group border"
                  >
                    <Avatar className="h-14 w-14 rounded-lg border">
                      <AvatarImage src={product?.imageUrl} alt={product?.title || 'Product'} className="object-cover" />
                      <AvatarFallback className="rounded-lg bg-muted">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{product?.title || 'Unknown Product'}</p>
                        {product?.url && (
                          <a href={product.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {product?.brand && (
                          <>
                            <span className="text-sm text-muted-foreground">{product.brand}</span>
                            <span className="text-muted-foreground">•</span>
                          </>
                        )}
                        {product?.category && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            {product.category}
                          </Badge>
                        )}
                        <ChoiceIcon choice={scan.userChoice} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(scan.scannedAt), { addSuffix: true })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <ChoiceButtons 
                        scan={scan} 
                        onUpdate={(choice) => handleChoiceUpdate(scan.id, choice)} 
                      />
                      <div className={cn("flex items-center justify-center rounded-full px-3 py-1.5", getScoreBgColor(score))}>
                        <span className={cn("text-lg font-bold", getScoreColor(score))}>{score}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No products scanned yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Use the Chrome extension to scan products while shopping.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
