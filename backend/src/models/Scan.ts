import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// Types
// ============================================

export type UserChoice = 'purchased' | 'skipped' | 'alternative' | 'saved' | null;

export interface IScan extends Document {
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  greenScore: number;
  userChoice: UserChoice;
  alternativeChosen?: mongoose.Types.ObjectId; // If user chose an alternative
  carbonImpact: number; // CO2 saved/added based on choice
  scannedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Schema
// ============================================

const ScanSchema = new Schema<IScan>({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true,
  },
  product: { 
    type: Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true,
  },
  greenScore: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100,
  },
  userChoice: { 
    type: String, 
    enum: ['purchased', 'skipped', 'alternative', 'saved', null],
    default: null,
  },
  alternativeChosen: { 
    type: Schema.Types.ObjectId, 
    ref: 'Product',
  },
  carbonImpact: { 
    type: Number, 
    default: 0,
  },
  scannedAt: { 
    type: Date, 
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
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

ScanSchema.index({ user: 1, scannedAt: -1 });
ScanSchema.index({ user: 1, product: 1 }, { unique: true }); // One scan per user per product
ScanSchema.index({ scannedAt: -1 });

// ============================================
// Statics
// ============================================

ScanSchema.statics.getUserHistory = async function(
  userId: mongoose.Types.ObjectId,
  options: { limit?: number; offset?: number; startDate?: Date; endDate?: Date } = {}
): Promise<IScan[]> {
  const { limit = 50, offset = 0, startDate, endDate } = options;
  
  const query: Record<string, unknown> = { user: userId };
  
  if (startDate || endDate) {
    query.scannedAt = {};
    if (startDate) (query.scannedAt as Record<string, Date>).$gte = startDate;
    if (endDate) (query.scannedAt as Record<string, Date>).$lte = endDate;
  }

  return this.find(query)
    .populate('product', 'title brand price imageUrl analysis.greenScore category')
    .sort({ scannedAt: -1 })
    .skip(offset)
    .limit(limit);
};

ScanSchema.statics.getUserStats = async function(
  userId: mongoose.Types.ObjectId
): Promise<{
  totalScans: number;
  averageScore: number;
  carbonSaved: number;
  choiceBreakdown: Record<string, number>;
}> {
  const result = await this.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: null,
        totalScans: { $sum: 1 },
        averageScore: { $avg: '$greenScore' },
        carbonSaved: { $sum: '$carbonImpact' },
        choices: { $push: '$userChoice' },
      },
    },
  ]);

  if (result.length === 0) {
    return {
      totalScans: 0,
      averageScore: 0,
      carbonSaved: 0,
      choiceBreakdown: {},
    };
  }

  const { totalScans, averageScore, carbonSaved, choices } = result[0];
  
  // Count choice breakdown
  const choiceBreakdown = choices.reduce((acc: Record<string, number>, choice: string | null) => {
    const key = choice || 'pending';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    totalScans,
    averageScore: Math.round(averageScore * 10) / 10,
    carbonSaved: Math.round(carbonSaved * 100) / 100,
    choiceBreakdown,
  };
};

ScanSchema.statics.getWeeklyActivity = async function(
  userId: mongoose.Types.ObjectId
): Promise<Array<{ date: string; scans: number; avgScore: number }>> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const result = await this.aggregate([
    { 
      $match: { 
        user: userId,
        scannedAt: { $gte: sevenDaysAgo },
      } 
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$scannedAt' } },
        scans: { $sum: 1 },
        avgScore: { $avg: '$greenScore' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return result.map(r => ({
    date: r._id,
    scans: r.scans,
    avgScore: Math.round(r.avgScore),
  }));
};

// ============================================
// Model
// ============================================

export interface IScanModel extends Model<IScan> {
  getUserHistory(
    userId: mongoose.Types.ObjectId,
    options?: { limit?: number; offset?: number; startDate?: Date; endDate?: Date }
  ): Promise<IScan[]>;
  getUserStats(userId: mongoose.Types.ObjectId): Promise<{
    totalScans: number;
    averageScore: number;
    carbonSaved: number;
    choiceBreakdown: Record<string, number>;
  }>;
  getWeeklyActivity(userId: mongoose.Types.ObjectId): Promise<Array<{ date: string; scans: number; avgScore: number }>>;
}

export const Scan = mongoose.model<IScan, IScanModel>('Scan', ScanSchema);
