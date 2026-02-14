import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// Types
// ============================================

export interface IUserStats {
  totalScans: number;
  averageScore: number;
  carbonSaved: number; // in kg
  currentStreak: number;
  longestStreak: number;
  lastScanDate?: Date;
}

export interface IUserPreferences {
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

export interface IUser extends Document {
  email: string;
  displayName: string;
  avatar?: string;
  extensionId?: string; // Unique ID from Chrome extension
  stats: IUserStats;
  preferences: IUserPreferences;
  achievements: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Schema
// ============================================

const UserStatsSchema = new Schema<IUserStats>({
  totalScans: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  carbonSaved: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastScanDate: { type: Date },
}, { _id: false });

const UserPreferencesSchema = new Schema<IUserPreferences>({
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    weeklyReport: { type: Boolean, default: false },
  },
  privacy: {
    showOnLeaderboard: { type: Boolean, default: true },
    shareStats: { type: Boolean, default: true },
  },
}, { _id: false });

const UserSchema = new Schema<IUser>({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true,
  },
  displayName: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 50,
  },
  avatar: { 
    type: String,
    default: '',
  },
  extensionId: { 
    type: String, 
    unique: true,
    sparse: true, // Allow multiple null values
  },
  stats: { 
    type: UserStatsSchema, 
    default: () => ({}) 
  },
  preferences: { 
    type: UserPreferencesSchema, 
    default: () => ({}) 
  },
  achievements: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Achievement' 
  }],
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
// Indexes
// ============================================

UserSchema.index({ 'stats.averageScore': -1 }); // For leaderboard sorting
UserSchema.index({ createdAt: -1 });

// ============================================
// Methods
// ============================================

UserSchema.methods.updateStreak = function(): void {
  const now = new Date();
  const lastScan = this.stats.lastScanDate;

  if (!lastScan) {
    this.stats.currentStreak = 1;
  } else {
    const daysDiff = Math.floor((now.getTime() - lastScan.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      // Same day, no change
    } else if (daysDiff === 1) {
      // Consecutive day
      this.stats.currentStreak += 1;
    } else {
      // Streak broken
      this.stats.currentStreak = 1;
    }
  }

  // Update longest streak
  if (this.stats.currentStreak > this.stats.longestStreak) {
    this.stats.longestStreak = this.stats.currentStreak;
  }

  this.stats.lastScanDate = now;
};

// ============================================
// Statics
// ============================================

UserSchema.statics.getLeaderboard = async function(limit: number = 10): Promise<IUser[]> {
  return this.find({ 'preferences.privacy.showOnLeaderboard': true })
    .sort({ 'stats.averageScore': -1, 'stats.totalScans': -1 })
    .limit(limit)
    .select('displayName avatar stats.averageScore stats.totalScans stats.carbonSaved');
};

// ============================================
// Model
// ============================================

export interface IUserModel extends Model<IUser> {
  getLeaderboard(limit?: number): Promise<IUser[]>;
}

export const User = mongoose.model<IUser, IUserModel>('User', UserSchema);
