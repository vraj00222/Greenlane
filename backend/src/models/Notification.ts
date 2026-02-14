import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// Types
// ============================================

export type NotificationType = 'achievement' | 'streak' | 'milestone' | 'tip' | 'system';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  icon: string;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationModel extends Model<INotification> {
  createAchievementNotification(
    userId: mongoose.Types.ObjectId,
    achievementName: string,
    xpReward: number
  ): Promise<INotification>;
  createStreakNotification(
    userId: mongoose.Types.ObjectId,
    streakDays: number
  ): Promise<INotification>;
  createMilestoneNotification(
    userId: mongoose.Types.ObjectId,
    milestone: string,
    value: number
  ): Promise<INotification>;
}

// ============================================
// Schema
// ============================================

const NotificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['achievement', 'streak', 'milestone', 'tip', 'system'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxLength: 100,
    },
    message: {
      type: String,
      required: true,
      maxLength: 500,
    },
    icon: {
      type: String,
      default: '🔔',
    },
    read: {
      type: Boolean,
      default: false,
    },
    actionUrl: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc: unknown, ret: Record<string, unknown>) => {
        ret.id = (ret._id as { toString(): string }).toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for fetching user's recent notifications
NotificationSchema.index({ user: 1, createdAt: -1 });

// ============================================
// Static Methods
// ============================================

NotificationSchema.statics.createAchievementNotification = async function (
  userId: mongoose.Types.ObjectId,
  achievementName: string,
  xpReward: number
): Promise<INotification> {
  return this.create({
    user: userId,
    type: 'achievement',
    title: '🏆 Achievement Unlocked!',
    message: `You earned "${achievementName}" and gained ${xpReward} XP!`,
    icon: '🏆',
    actionUrl: '/achievements',
    metadata: { achievementName, xpReward },
  });
};

NotificationSchema.statics.createStreakNotification = async function (
  userId: mongoose.Types.ObjectId,
  streakDays: number
): Promise<INotification> {
  const milestones: Record<number, string> = {
    3: '🔥 3-Day Streak!',
    7: '🔥 Week-Long Streak!',
    14: '⚡ 2-Week Streak!',
    30: '🌟 Monthly Streak Master!',
  };

  const title = milestones[streakDays] || `🔥 ${streakDays}-Day Streak!`;

  return this.create({
    user: userId,
    type: 'streak',
    title,
    message: `Amazing! You've scanned products for ${streakDays} days in a row. Keep it up!`,
    icon: '🔥',
    metadata: { streakDays },
  });
};

NotificationSchema.statics.createMilestoneNotification = async function (
  userId: mongoose.Types.ObjectId,
  milestone: string,
  value: number
): Promise<INotification> {
  const milestoneMessages: Record<string, string> = {
    scans: `You've scanned ${value} products! Your eco-awareness is growing.`,
    carbon: `You've saved ${value}kg of carbon! That's equivalent to planting ${Math.round(value / 20)} trees.`,
    score: `Your average eco-score reached ${value}! You're making great sustainable choices.`,
  };

  return this.create({
    user: userId,
    type: 'milestone',
    title: '🎯 Milestone Reached!',
    message: milestoneMessages[milestone] || `You reached a new milestone: ${milestone} = ${value}`,
    icon: '🎯',
    metadata: { milestone, value },
  });
};

// ============================================
// Model Export
// ============================================

export const Notification = mongoose.model<INotification, NotificationModel>(
  'Notification',
  NotificationSchema
);

export default Notification;
