// Mock data for the dashboard - will be replaced with real API data in Phase 6+

export interface ScannedProduct {
  id: string
  title: string
  score: number
  brand: string
  image: string
  timestamp: Date
  carbonSaved: number
  category: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  progress: number
  maxProgress: number
  unlocked: boolean
  unlockedAt?: Date
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface LeaderboardUser {
  rank: number
  username: string
  avatar: string
  score: number
  productsScanned: number
  carbonSaved: number
  streak: number
}

export interface WeeklyData {
  day: string
  productsScanned: number
  ecoChoices: number
  carbonSaved: number
}

// Weekly activity data for charts
export const weeklyActivityData: WeeklyData[] = [
  { day: 'Mon', productsScanned: 4, ecoChoices: 3, carbonSaved: 2.4 },
  { day: 'Tue', productsScanned: 6, ecoChoices: 5, carbonSaved: 3.8 },
  { day: 'Wed', productsScanned: 3, ecoChoices: 2, carbonSaved: 1.6 },
  { day: 'Thu', productsScanned: 8, ecoChoices: 7, carbonSaved: 5.2 },
  { day: 'Fri', productsScanned: 5, ecoChoices: 4, carbonSaved: 3.0 },
  { day: 'Sat', productsScanned: 10, ecoChoices: 8, carbonSaved: 6.4 },
  { day: 'Sun', productsScanned: 7, ecoChoices: 6, carbonSaved: 4.2 },
]

// Monthly trend data
export const monthlyTrendData = [
  { month: 'Jan', score: 45 },
  { month: 'Feb', score: 52 },
  { month: 'Mar', score: 58 },
  { month: 'Apr', score: 61 },
  { month: 'May', score: 67 },
  { month: 'Jun', score: 72 },
]

// Recently scanned products
export const recentProducts: ScannedProduct[] = [
  {
    id: '1',
    title: 'Organic Cotton T-Shirt',
    score: 85,
    brand: 'EcoWear',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    carbonSaved: 2.5,
    category: 'Clothing',
  },
  {
    id: '2',
    title: 'Bamboo Toothbrush Set',
    score: 92,
    brand: 'GreenSmile',
    image: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=100&h=100&fit=crop',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    carbonSaved: 0.8,
    category: 'Personal Care',
  },
  {
    id: '3',
    title: 'Recycled Plastic Backpack',
    score: 78,
    brand: 'ReThread',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=100&h=100&fit=crop',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    carbonSaved: 3.2,
    category: 'Accessories',
  },
  {
    id: '4',
    title: 'Fast Fashion Jeans',
    score: 32,
    brand: 'QuickStyle',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=100&h=100&fit=crop',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
    carbonSaved: -1.5,
    category: 'Clothing',
  },
  {
    id: '5',
    title: 'Solar Power Bank',
    score: 88,
    brand: 'SunCharge',
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=100&h=100&fit=crop',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    carbonSaved: 4.1,
    category: 'Electronics',
  },
]

// User achievements
export const achievements: Achievement[] = [
  {
    id: '1',
    name: 'First Scan',
    description: 'Scan your first product',
    icon: '🔍',
    progress: 1,
    maxProgress: 1,
    unlocked: true,
    unlockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    rarity: 'common',
  },
  {
    id: '2',
    name: 'Eco Warrior',
    description: 'Choose 10 eco-friendly alternatives',
    icon: '🌿',
    progress: 8,
    maxProgress: 10,
    unlocked: false,
    rarity: 'rare',
  },
  {
    id: '3',
    name: 'Carbon Cutter',
    description: 'Save 50kg of CO2 emissions',
    icon: '🌍',
    progress: 26.7,
    maxProgress: 50,
    unlocked: false,
    rarity: 'epic',
  },
  {
    id: '4',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    progress: 5,
    maxProgress: 7,
    unlocked: false,
    rarity: 'rare',
  },
  {
    id: '5',
    name: 'Sustainable Scanner',
    description: 'Scan 100 products',
    icon: '📊',
    progress: 43,
    maxProgress: 100,
    unlocked: false,
    rarity: 'epic',
  },
  {
    id: '6',
    name: 'Planet Protector',
    description: 'Reach a 90+ average eco-score',
    icon: '🛡️',
    progress: 72,
    maxProgress: 90,
    unlocked: false,
    rarity: 'legendary',
  },
]

// Leaderboard data
export const leaderboardData: LeaderboardUser[] = [
  {
    rank: 1,
    username: 'EcoChampion',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=champion',
    score: 2450,
    productsScanned: 156,
    carbonSaved: 89.5,
    streak: 21,
  },
  {
    rank: 2,
    username: 'GreenGuru',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guru',
    score: 2180,
    productsScanned: 134,
    carbonSaved: 76.2,
    streak: 14,
  },
  {
    rank: 3,
    username: 'SustainableSteve',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=steve',
    score: 1920,
    productsScanned: 118,
    carbonSaved: 65.8,
    streak: 18,
  },
  {
    rank: 4,
    username: 'You',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=you',
    score: 1540,
    productsScanned: 43,
    carbonSaved: 26.7,
    streak: 5,
  },
  {
    rank: 5,
    username: 'PlanetPal',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pal',
    score: 1320,
    productsScanned: 89,
    carbonSaved: 45.3,
    streak: 9,
  },
]

// User stats summary
export const userStats = {
  totalProductsScanned: 43,
  ecoChoicesMade: 31,
  averageEcoScore: 72,
  carbonSaved: 26.7,
  currentStreak: 5,
  longestStreak: 12,
  rank: 4,
  totalUsers: 1247,
  level: 8,
  xpToNextLevel: 340,
  totalXp: 1540,
}

// Category breakdown for radar chart
export const categoryBreakdown = [
  { category: 'Clothing', score: 75, count: 18 },
  { category: 'Electronics', score: 68, count: 8 },
  { category: 'Personal Care', score: 82, count: 12 },
  { category: 'Home', score: 71, count: 5 },
  { category: 'Food', score: 65, count: 0 },
  { category: 'Other', score: 70, count: 0 },
]
