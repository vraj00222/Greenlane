import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// Types
// ============================================

export type AchievementCategory = 
  | 'scanning' 
  | 'sustainability' 
  | 'streak' 
  | 'community' 
  | 'special';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface IAchievement extends Document {
  code: string; // Unique identifier like 'FIRST_SCAN', 'ECO_WARRIOR'
  name: string;
  description: string;
  icon: string; // Emoji or icon name
  category: AchievementCategory;
  rarity: AchievementRarity;
  requirement: {
    type: string; // 'scans', 'score', 'streak', 'carbon', 'special'
    value: number;
    comparison: 'gte' | 'eq' | 'lte';
  };
  xpReward: number;
  unlockedBy: number; // Count of users who have this
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserAchievement extends Document {
  user: mongoose.Types.ObjectId;
  achievement: mongoose.Types.ObjectId;
  unlockedAt: Date;
  progress?: number; // For progressive achievements
}

// ============================================
// Achievement Schema
// ============================================

const AchievementSchema = new Schema<IAchievement>({
  code: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
  },
  name: { 
    type: String, 
    required: true,
  },
  description: { 
    type: String, 
    required: true,
  },
  icon: { 
    type: String, 
    required: true,
  },
  category: { 
    type: String, 
    enum: ['scanning', 'sustainability', 'streak', 'community', 'special'],
    required: true,
  },
  rarity: { 
    type: String, 
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common',
  },
  requirement: {
    type: { type: String, required: true },
    value: { type: Number, required: true },
    comparison: { type: String, enum: ['gte', 'eq', 'lte'], default: 'gte' },
  },
  xpReward: { 
    type: Number, 
    default: 10,
  },
  unlockedBy: { 
    type: Number, 
    default: 0,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc: any, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// ============================================
// User Achievement Schema (join table)
// ============================================

const UserAchievementSchema = new Schema<IUserAchievement>({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
  },
  achievement: { 
    type: Schema.Types.ObjectId, 
    ref: 'Achievement', 
    required: true,
  },
  unlockedAt: { 
    type: Date, 
    default: Date.now,
  },
  progress: { 
    type: Number,
    min: 0,
    max: 100,
  },
}, {
  timestamps: true,
});

UserAchievementSchema.index({ user: 1, achievement: 1 }, { unique: true });

// ============================================
// Statics
// ============================================

AchievementSchema.statics.seedAchievements = async function(): Promise<void> {
  const achievements = [
    // Scanning achievements
    {
      code: 'FIRST_SCAN',
      name: 'First Steps',
      description: 'Scan your first product',
      icon: '🌱',
      category: 'scanning',
      rarity: 'common',
      requirement: { type: 'scans', value: 1, comparison: 'gte' },
      xpReward: 10,
    },
    {
      code: 'SCAN_10',
      name: 'Getting Started',
      description: 'Scan 10 products',
      icon: '📦',
      category: 'scanning',
      rarity: 'common',
      requirement: { type: 'scans', value: 10, comparison: 'gte' },
      xpReward: 25,
    },
    {
      code: 'SCAN_50',
      name: 'Product Detective',
      description: 'Scan 50 products',
      icon: '🔍',
      category: 'scanning',
      rarity: 'rare',
      requirement: { type: 'scans', value: 50, comparison: 'gte' },
      xpReward: 50,
    },
    {
      code: 'SCAN_100',
      name: 'Sustainability Expert',
      description: 'Scan 100 products',
      icon: '🎓',
      category: 'scanning',
      rarity: 'epic',
      requirement: { type: 'scans', value: 100, comparison: 'gte' },
      xpReward: 100,
    },
    // Sustainability achievements
    {
      code: 'ECO_WARRIOR',
      name: 'Eco Warrior',
      description: 'Maintain an average score above 70',
      icon: '🌿',
      category: 'sustainability',
      rarity: 'rare',
      requirement: { type: 'score', value: 70, comparison: 'gte' },
      xpReward: 50,
    },
    {
      code: 'GREEN_CHAMPION',
      name: 'Green Champion',
      description: 'Maintain an average score above 85',
      icon: '🏆',
      category: 'sustainability',
      rarity: 'epic',
      requirement: { type: 'score', value: 85, comparison: 'gte' },
      xpReward: 100,
    },
    {
      code: 'CARBON_SAVER',
      name: 'Carbon Saver',
      description: 'Save 10kg of carbon emissions',
      icon: '💨',
      category: 'sustainability',
      rarity: 'rare',
      requirement: { type: 'carbon', value: 10, comparison: 'gte' },
      xpReward: 75,
    },
    {
      code: 'TREE_HUGGER',
      name: 'Tree Hugger',
      description: 'Save 50kg of carbon emissions',
      icon: '🌳',
      category: 'sustainability',
      rarity: 'epic',
      requirement: { type: 'carbon', value: 50, comparison: 'gte' },
      xpReward: 150,
    },
    // Streak achievements
    {
      code: 'STREAK_7',
      name: 'Week Warrior',
      description: 'Maintain a 7-day scanning streak',
      icon: '🔥',
      category: 'streak',
      rarity: 'rare',
      requirement: { type: 'streak', value: 7, comparison: 'gte' },
      xpReward: 50,
    },
    {
      code: 'STREAK_30',
      name: 'Monthly Master',
      description: 'Maintain a 30-day scanning streak',
      icon: '⚡',
      category: 'streak',
      rarity: 'epic',
      requirement: { type: 'streak', value: 30, comparison: 'gte' },
      xpReward: 200,
    },
    // Community achievements
    {
      code: 'LEADERBOARD_TOP10',
      name: 'Rising Star',
      description: 'Reach the top 10 on the leaderboard',
      icon: '⭐',
      category: 'community',
      rarity: 'epic',
      requirement: { type: 'leaderboard', value: 10, comparison: 'lte' },
      xpReward: 100,
    },
    // Special achievements
    {
      code: 'EARLY_ADOPTER',
      name: 'Early Adopter',
      description: 'Join during the beta period',
      icon: '🚀',
      category: 'special',
      rarity: 'legendary',
      requirement: { type: 'special', value: 1, comparison: 'eq' },
      xpReward: 250,
    },
  ];

  for (const achievement of achievements) {
    await this.findOneAndUpdate(
      { code: achievement.code },
      achievement,
      { upsert: true, new: true }
    );
  }

  console.log(`✅ Seeded ${achievements.length} achievements`);
};

// ============================================
// Models
// ============================================

export interface IAchievementModel extends Model<IAchievement> {
  seedAchievements(): Promise<void>;
}

export const Achievement = mongoose.model<IAchievement, IAchievementModel>('Achievement', AchievementSchema);
export const UserAchievement = mongoose.model<IUserAchievement>('UserAchievement', UserAchievementSchema);
