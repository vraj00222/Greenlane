'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Crown, Medal, Award, Users } from "lucide-react";
import { useLeaderboard } from "@/lib/hooks";
import { useCurrentUser } from "@/lib/user-context";

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-slate-400" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function LeaderboardConnected({ limit = 10 }: { limit?: number }) {
  const { userId } = useCurrentUser();
  const { data: leaderboard, isLoading, error } = useLeaderboard(limit);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Leaderboard
          </CardTitle>
          <CardDescription>Loading rankings...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-6 w-6 bg-muted rounded" />
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/2 bg-muted rounded" />
                  <div className="h-3 w-1/3 bg-muted rounded" />
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
            <Users className="h-5 w-5" />
            Leaderboard
          </CardTitle>
          <CardDescription className="text-red-500">Failed to load leaderboard</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const hasData = leaderboard && leaderboard.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Community Leaderboard
        </CardTitle>
        <CardDescription>
          {hasData ? 'Top sustainable shoppers this month' : 'Be the first to join the leaderboard!'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ScrollArea className="h-[320px] pr-4">
            <div className="space-y-3">
              {leaderboard.map((entry) => {
                const isCurrentUser = entry.id === userId;
                
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                      isCurrentUser
                        ? "bg-primary/5 border-primary/20"
                        : "bg-card hover:bg-accent/50"
                    }`}
                  >
                    {/* Rank */}
                    <div className="w-8 flex justify-center">
                      {getRankIcon(entry.rank)}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={entry.avatar} alt={entry.displayName} />
                      <AvatarFallback className={entry.rank <= 3 ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white" : ""}>
                        {getInitials(entry.displayName)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name & Stats */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {entry.displayName}
                          {isCurrentUser && (
                            <span className="text-xs text-muted-foreground ml-1">(you)</span>
                          )}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {entry.stats.totalScans} scans • {entry.stats.carbonSaved.toFixed(1)}kg CO₂ saved
                      </p>
                    </div>

                    {/* Score */}
                    <Badge
                      variant={entry.rank <= 3 ? "default" : "secondary"}
                      className={entry.rank === 1 ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                    >
                      {Math.round(entry.stats.averageScore)}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="h-[320px] flex flex-col items-center justify-center text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No users on the leaderboard yet. Start scanning to be the first!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
