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

// ============================================
// SWR Configuration
// ============================================

const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
};

// ============================================
// User Hooks
// ============================================

export function useUser(userId: string | null) {
  return useSWR<User>(
    userId ? ['user', userId] : null,
    () => getUser(userId!),
    {
      ...swrConfig,
      revalidateOnFocus: true,
    }
  );
}

// ============================================
// Scans Hooks
// ============================================

export function useUserScans(userId: string | null, limit = 50) {
  return useSWR<Scan[]>(
    userId ? ['scans', userId, limit] : null,
    () => getUserScans(userId!, { limit }),
    swrConfig
  );
}

export function useWeeklyActivity(userId: string | null) {
  return useSWR<WeeklyActivity[]>(
    userId ? ['weekly-activity', userId] : null,
    () => getWeeklyActivity(userId!),
    swrConfig
  );
}

// ============================================
// Achievements Hooks
// ============================================

export function useUserAchievements(userId: string | null) {
  return useSWR<{
    achievements: Achievement[];
    summary: { total: number; earned: number; totalXP: number };
  }>(
    userId ? ['achievements', userId] : null,
    () => getUserAchievements(userId!),
    swrConfig
  );
}

// ============================================
// Leaderboard Hooks
// ============================================

export function useLeaderboard(limit = 10) {
  return useSWR<LeaderboardEntry[]>(
    ['leaderboard', limit],
    () => getLeaderboard(limit),
    {
      ...swrConfig,
      refreshInterval: 60000, // Refresh every minute
    }
  );
}

// ============================================
// Notifications Hook
// ============================================

export function useNotifications(userId: string | null, limit = 20) {
  return useSWR(
    userId ? ['notifications', userId, limit] : null,
    async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/notifications/user/${userId}?limit=${limit}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result.data as { notifications: any[]; unreadCount: number };
    },
    {
      ...swrConfig,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );
}

// ============================================
// Health Check Hook
// ============================================

export function useHealthStatus() {
  return useSWR(
    'health',
    getHealthStatus,
    {
      ...swrConfig,
      refreshInterval: 30000, // Check every 30 seconds
    }
  );
}
