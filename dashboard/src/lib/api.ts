// API Client for GreenLane Backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ============================================
// Types
// ============================================

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

// ============================================
// API Response Types
// ============================================

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// ============================================
// Fetch Wrapper
// ============================================

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const result: ApiResponse<T> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'API request failed');
  }

  return result.data;
}

// ============================================
// User API
// ============================================

export async function getUser(userId: string): Promise<User> {
  return fetchApi<User>(`/api/users/${userId}`);
}

export async function getUserByExtension(extensionId: string): Promise<User> {
  return fetchApi<User>(`/api/users/extension/${extensionId}`);
}

export async function createOrGetUser(data: {
  email: string;
  displayName: string;
  extensionId?: string;
  avatar?: string;
}): Promise<{ data: User; isNew: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  const result = await response.json();
  if (!result.success) throw new Error(result.error);
  return { data: result.data, isNew: result.isNew };
}

export async function updateUser(
  userId: string,
  updates: Partial<User>
): Promise<User> {
  return fetchApi<User>(`/api/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  return fetchApi<LeaderboardEntry[]>(`/api/users/leaderboard/top?limit=${limit}`);
}

// ============================================
// Scans API
// ============================================

export async function getUserScans(
  userId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<Scan[]> {
  const params = new URLSearchParams();
  if (options.limit) params.set('limit', options.limit.toString());
  if (options.offset) params.set('offset', options.offset.toString());
  
  const query = params.toString() ? `?${params.toString()}` : '';
  return fetchApi<Scan[]>(`/api/scans/user/${userId}${query}`);
}

export async function getUserScanStats(userId: string): Promise<{
  totalScans: number;
  averageScore: number;
  carbonSaved: number;
  choiceBreakdown: Record<string, number>;
}> {
  return fetchApi(`/api/scans/user/${userId}/stats`);
}

export async function getWeeklyActivity(userId: string): Promise<WeeklyActivity[]> {
  return fetchApi<WeeklyActivity[]>(`/api/scans/user/${userId}/weekly`);
}

export async function updateScanChoice(
  scanId: string,
  choice: 'purchased' | 'skipped' | 'alternative' | 'saved',
  alternativeId?: string
): Promise<{ scan: Scan; carbonImpact: number; newAchievements: string[] }> {
  return fetchApi(`/api/scans/${scanId}/choice`, {
    method: 'PATCH',
    body: JSON.stringify({ choice, alternativeId }),
  });
}

// ============================================
// Achievements API
// ============================================

export async function getAllAchievements(): Promise<Achievement[]> {
  return fetchApi<Achievement[]>('/api/achievements');
}

export async function getUserAchievements(userId: string): Promise<{
  achievements: Achievement[];
  summary: {
    total: number;
    earned: number;
    totalXP: number;
  };
}> {
  return fetchApi(`/api/achievements/user/${userId}`);
}

// ============================================
// Products API
// ============================================

export async function getProduct(productId: string): Promise<Product> {
  return fetchApi<Product>(`/api/products/${productId}`);
}

export async function getTopSustainableProducts(
  category?: string,
  limit = 10
): Promise<Product[]> {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  params.set('limit', limit.toString());
  
  return fetchApi<Product[]>(`/api/products/top/sustainable?${params.toString()}`);
}

// ============================================
// Health Check
// ============================================

export async function getHealthStatus(): Promise<{
  status: string;
  timestamp: string;
  version: string;
  database: { isConnected: boolean; readyState: string };
  ai: { provider: string; model: string };
}> {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
}
