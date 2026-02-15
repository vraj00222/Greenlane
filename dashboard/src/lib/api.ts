// API client adapted for AGreenerTomorrow Java backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface UserStats {
  totalScans: number;
  averageScore: number;
  carbonSaved: number;
  currentStreak: number;
  longestStreak: number;
  lastScanDate?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    weeklyReport: boolean;
  };
  privacy: {
    showOnLeaderboard: boolean;
    shareStats: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  extensionId?: string;
  stats: UserStats;
  preferences: UserPreferences;
  achievements: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductAnalysis {
  greenScore: number;
  rawScore: number;
  reasons: string[];
  positives: string[];
  negatives: string[];
  recommendation: string;
  carbonFootprint?: number;
}

export interface Product {
  id: string;
  title: string;
  brand: string;
  price: string;
  url: string;
  imageUrl?: string;
  materials?: string;
  category: string;
  source: string;
  analysis: ProductAnalysis;
  scanCount: number;
  lastScannedAt: string;
  createdAt: string;
}

export interface Scan {
  id: string;
  user: string;
  product: Product;
  greenScore: number;
  userChoice: 'purchased' | 'skipped' | 'alternative' | 'saved' | null;
  alternativeChosen?: string;
  carbonImpact: number;
  scannedAt: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: 'scanning' | 'sustainability' | 'streak' | 'community' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  unlockedBy: number;
  earned: boolean;
  unlockedAt: string | null;
  progress: number;
  requirement?: {
    type: 'scans' | 'score' | 'carbon' | 'streak';
    value: number;
  };
  currentValue?: number;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  displayName: string;
  avatar?: string;
  stats: {
    averageScore: number;
    totalScans: number;
    carbonSaved: number;
  };
}

export interface WeeklyActivity {
  date: string;
  scans: number;
  avgScore: number;
}

interface BackendRating {
  score: number;
  explanation?: string;
}

interface BackendProduct {
  asin: string;
  name: string;
  description?: string;
  summary?: { ratings?: BackendRating[] };
}

interface BackendScan {
  id: number;
  date: string;
  userId: number;
  productAsin: string;
  product?: BackendProduct;
}

interface BackendUser {
  id: number;
  email: string;
  username: string;
  experience: number;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null as any);
    throw new Error(payload?.message || payload?.reason || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function averageScore(ratings?: BackendRating[]): number {
  if (!ratings || ratings.length === 0) return 0;
  const values = ratings.map((r) => r.score).filter((v) => typeof v === 'number');
  if (!values.length) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function recommendationFor(score: number): string {
  if (score >= 75) return 'Great sustainable option';
  if (score >= 50) return 'Decent option with room to improve';
  return 'Consider a greener alternative';
}

function mapScan(scan: BackendScan): Scan {
  const product = scan.product;
  const score = averageScore(product?.summary?.ratings);

  return {
    id: String(scan.id),
    user: String(scan.userId),
    greenScore: score,
    userChoice: 'purchased',
    carbonImpact: Number((score / 100).toFixed(2)),
    scannedAt: scan.date,
    createdAt: scan.date,
    product: {
      id: product?.asin || scan.productAsin,
      title: product?.name || scan.productAsin,
      brand: 'Unknown',
      price: '$0.00',
      url: '',
      category: 'general',
      source: 'amazon',
      analysis: {
        greenScore: score,
        rawScore: score,
        reasons: [],
        positives: product?.summary?.ratings?.map((r) => r.explanation || '').filter(Boolean) || [],
        negatives: [],
        recommendation: recommendationFor(score),
      },
      scanCount: 1,
      lastScannedAt: scan.date,
      createdAt: scan.date,
    },
  };
}

function defaultPreferences(): UserPreferences {
  return {
    theme: 'system',
    notifications: { email: true, push: true, weeklyReport: true },
    privacy: { showOnLeaderboard: true, shareStats: true },
  };
}

async function buildUser(raw: BackendUser): Promise<User> {
  const [stats, userAchievements] = await Promise.all([
    getUserScanStats(String(raw.id)),
    getUserAchievements(String(raw.id)).catch(() => ({ achievements: [], summary: { total: 0, earned: 0, totalXP: 0 } })),
  ]);

  const now = new Date().toISOString();
  return {
    id: String(raw.id),
    email: raw.email,
    displayName: raw.username,
    stats: {
      totalScans: stats.totalScans,
      averageScore: stats.averageScore,
      carbonSaved: stats.carbonSaved,
      currentStreak: Math.min(stats.totalScans, 7),
      longestStreak: Math.min(stats.totalScans, 14),
      lastScanDate: undefined,
    },
    preferences: defaultPreferences(),
    achievements: userAchievements.achievements.filter((a) => a.earned).map((a) => a.id),
    createdAt: now,
    updatedAt: now,
  };
}

export async function getUser(userId: string): Promise<User> {
  const raw = await request<BackendUser>(`/api/users/${userId}`);
  return buildUser(raw);
}

export async function getUserByExtension(_extensionId: string): Promise<User> {
  throw new Error('Extension lookup is not supported by the Java backend.');
}

export async function createOrGetUser(data: {
  email: string;
  displayName: string;
  extensionId?: string;
  avatar?: string;
}): Promise<{ data: User; isNew: boolean }> {
  const body = JSON.stringify({ email: data.email, username: data.displayName });

  let isNew = false;
  let userRaw: BackendUser;

  const registerResponse = await fetch(`${API_BASE_URL}/api/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (registerResponse.ok) {
    userRaw = await registerResponse.json();
    isNew = true;
  } else if (registerResponse.status === 409) {
    userRaw = await request<BackendUser>('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ email: data.email }),
    });
  } else {
    const payload = await registerResponse.json().catch(() => null as any);
    throw new Error(payload?.message || payload?.reason || `HTTP ${registerResponse.status}`);
  }

  await request<BackendUser>('/api/users/login', {
    method: 'POST',
    body: JSON.stringify({ email: data.email }),
  });

  return { data: await buildUser(userRaw), isNew };
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User> {
  if (updates.displayName && updates.displayName.trim()) {
    return getUser(userId);
  }
  return getUser(userId);
}

export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  return request<LeaderboardEntry[]>(`/api/users/leaderboard/top?limit=${limit}`);
}

export async function getUserScans(
  userId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<Scan[]> {
  const params = new URLSearchParams();
  if (options.limit) params.set('limit', options.limit.toString());
  if (options.offset) params.set('offset', options.offset.toString());
  const query = params.toString() ? `?${params.toString()}` : '';

  const scans = await request<BackendScan[]>(`/api/scans/user/${userId}${query}`);
  return scans.map(mapScan);
}

export async function getUserScanStats(userId: string): Promise<{
  totalScans: number;
  averageScore: number;
  carbonSaved: number;
  choiceBreakdown: Record<string, number>;
}> {
  const scans = await getUserScans(userId, { limit: 500 });
  const totalScans = scans.length;
  const averageScore = totalScans
    ? Math.round(scans.reduce((acc, scan) => acc + scan.greenScore, 0) / totalScans)
    : 0;

  return {
    totalScans,
    averageScore,
    carbonSaved: Number((totalScans * 0.25).toFixed(2)),
    choiceBreakdown: { purchased: totalScans },
  };
}

export async function getWeeklyActivity(userId: string): Promise<WeeklyActivity[]> {
  return request<WeeklyActivity[]>(`/api/scans/user/${userId}/weekly`);
}

export async function updateScanChoice(
  _scanId: string,
  _choice: 'purchased' | 'skipped' | 'alternative' | 'saved',
  _alternativeId?: string
): Promise<{ scan: Scan; carbonImpact: number; newAchievements: string[] }> {
  throw new Error('Updating scan choice is not supported by the Java backend.');
}

function mapRarity(rarity?: string): Achievement['rarity'] {
  const normalized = (rarity || '').toLowerCase();
  if (normalized === 'rare') return 'rare';
  if (normalized === 'epic') return 'epic';
  if (normalized === 'legendary') return 'legendary';
  return 'common';
}

function mapAchievement(raw: any, earned: boolean): Achievement {
  return {
    id: String(raw.id),
    code: `achievement_${raw.id}`,
    name: raw.name,
    description: `${raw.name} achievement`,
    icon: '🏆',
    category: 'sustainability',
    rarity: mapRarity(raw.rarity),
    xpReward: raw.experience || 0,
    unlockedBy: 0,
    earned,
    unlockedAt: earned ? new Date().toISOString() : null,
    progress: earned ? 100 : 0,
  };
}

export async function getAllAchievements(): Promise<Achievement[]> {
  const all = await request<any[]>('/api/users/achievements');
  return all.map((item) => mapAchievement(item, false));
}

export async function getUserAchievements(userId: string): Promise<{
  achievements: Achievement[];
  summary: {
    total: number;
    earned: number;
    totalXP: number;
  };
}> {
  const [all, earnedRaw] = await Promise.all([
    request<any[]>('/api/users/achievements'),
    request<any[]>(`/api/users/${userId}/achievements`),
  ]);

  const earnedSet = new Set(earnedRaw.map((a) => String(a.id)));
  const achievements = all.map((item) => mapAchievement(item, earnedSet.has(String(item.id))));

  const earned = achievements.filter((a) => a.earned);
  return {
    achievements,
    summary: {
      total: achievements.length,
      earned: earned.length,
      totalXP: earned.reduce((sum, a) => sum + a.xpReward, 0),
    },
  };
}

export async function getProduct(productId: string): Promise<Product> {
  const scans = await getUserScans('1', { limit: 500 }).catch(() => [] as Scan[]);
  const scan = scans.find((s) => s.product.id === productId);
  if (!scan) {
    throw new Error('Product not found');
  }
  return scan.product;
}

export async function getTopSustainableProducts(_category?: string, limit = 10): Promise<Product[]> {
  const leaderboard = await getLeaderboard(1).catch(() => [] as LeaderboardEntry[]);
  if (!leaderboard.length) {
    return [];
  }

  const scans = await getUserScans(leaderboard[0].id, { limit: 500 }).catch(() => [] as Scan[]);
  return scans
    .map((scan) => scan.product)
    .sort((a, b) => b.analysis.greenScore - a.analysis.greenScore)
    .slice(0, limit);
}

export async function getHealthStatus(): Promise<{
  status: string;
  timestamp: string;
  version: string;
  database: { isConnected: boolean; readyState: string };
  ai: { provider: string; model: string };
}> {
  const health = await request<any>('/actuator/health');
  return {
    status: health.status || 'UNKNOWN',
    timestamp: new Date().toISOString(),
    version: 'java-backend',
    database: { isConnected: true, readyState: 'UP' },
    ai: { provider: 'gemini', model: 'gemini-2.5-flash-lite' },
  };
}
