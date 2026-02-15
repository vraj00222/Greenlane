'use client';

import useSWR from 'swr';
import {
  getUser,
  getUserScans,
  getUserAchievements,
  getLeaderboard,
  getWeeklyActivity,
  getHealthStatus,
  type User,
  type Scan,
  type Achievement,
  type LeaderboardEntry,
  type WeeklyActivity,
} from './api';

const swrConfig = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
};

const realtimeConfig = {
  ...swrConfig,
  refreshInterval: 5000,
  revalidateIfStale: true,
};

export function useUser(userId: string | null) {
  return useSWR<User>(userId ? ['user', userId] : null, () => getUser(userId!), realtimeConfig);
}

export function useUserScans(userId: string | null, limit = 50) {
  return useSWR<Scan[]>(userId ? ['scans', userId, limit] : null, () => getUserScans(userId!, { limit }), realtimeConfig);
}

export function useWeeklyActivity(userId: string | null) {
  return useSWR<WeeklyActivity[]>(
    userId ? ['weekly-activity', userId] : null,
    () => getWeeklyActivity(userId!),
    realtimeConfig
  );
}

export function useUserAchievements(userId: string | null) {
  return useSWR<{ achievements: Achievement[]; summary: { total: number; earned: number; totalXP: number } }>(
    userId ? ['achievements', userId] : null,
    () => getUserAchievements(userId!),
    realtimeConfig
  );
}

export function useLeaderboard(limit = 10) {
  return useSWR<LeaderboardEntry[]>(['leaderboard', limit], () => getLeaderboard(limit), {
    ...swrConfig,
    refreshInterval: 60000,
  });
}

export function useNotifications(userId: string | null, _limit = 20) {
  return useSWR(
    userId ? ['notifications', userId] : null,
    async () => ({ notifications: [], unreadCount: 0 }),
    {
      ...swrConfig,
      refreshInterval: 30000,
    }
  );
}

export function useHealthStatus() {
  return useSWR('health', getHealthStatus, {
    ...swrConfig,
    refreshInterval: 30000,
  });
}
