import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// Types
// ============================================

export interface ISustainabilityAnalysis {
  greenScore: number;
  rawScore: number;
  reasons: string[];
  positives: string[];
  negatives: string[];
  recommendation: string;
  carbonFootprint?: number; // Estimated kg CO2
}

export interface IProduct extends Document {
  title: string;
  brand: string;
  price: string;
  url: string;
  imageUrl?: string;
  materials?: string;
  category?: string;
  source: string; // e.g., 'amazon.com', 'target.com'
  analysis: ISustainabilityAnalysis;
  scanCount: number; // How many users scanned this product
  lastScannedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Schema
// ============================================

const SustainabilityAnalysisSchema = new Schema<ISustainabilityAnalysis>({
  greenScore: { type: Number, required: true, min: 0, max: 100 },
  rawScore: { type: Number, required: true, min: 0, max: 100 },
  reasons: [{ type: String }],
  positives: [{ type: String }],
  negatives: [{ type: String }],
  recommendation: { type: String, default: '' },
  carbonFootprint: { type: Number },
}, { _id: false });

const ProductSchema = new Schema<IProduct>({
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 500,
  },
  brand: { 
    type: String,
    trim: true,
    default: 'Unknown',
  },
  price: { 
    type: String,
    default: '',
  },
  url: { 
    type: String, 
    required: true,
    unique: true,
  },
  imageUrl: { 
    type: String,
    default: '',
  },
  materials: { 
    type: String,
    default: '',
  },
  category: { 
    type: String,
    enum: ['electronics', 'clothing', 'food', 'home', 'beauty', 'other'],
    default: 'other',
  },
  source: { 
    type: String, 
    required: true,
  },
  analysis: { 
    type: SustainabilityAnalysisSchema, 
    required: true,
  },
  scanCount: { 
    type: Number, 
    default: 1,
  },
  lastScannedAt: { 
    type: Date, 
    default: Date.now,
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
// Indexes
// ============================================

// Note: url index is already created by unique: true on the field
ProductSchema.index({ 'analysis.greenScore': -1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ scanCount: -1 });
ProductSchema.index({ source: 1, createdAt: -1 });

// ============================================
// Statics
// ============================================

ProductSchema.statics.findOrCreate = async function(
  url: string, 
  productData: Partial<IProduct>
): Promise<{ product: IProduct; isNew: boolean }> {
  let product = await this.findOne({ url });
  
  if (product) {
    // Update scan count and last scanned date
    product.scanCount += 1;
    product.lastScannedAt = new Date();
    await product.save();
    return { product, isNew: false };
  }

  // Create new product
  product = await this.create({ ...productData, url });
  return { product, isNew: true };
};

ProductSchema.statics.getTopSustainable = async function(
  category?: string, 
  limit: number = 10
): Promise<IProduct[]> {
  const query = category ? { category } : {};
  return this.find(query)
    .sort({ 'analysis.greenScore': -1 })
    .limit(limit)
    .select('title brand price imageUrl analysis.greenScore category');
};

// ============================================
// Model
// ============================================

export interface IProductModel extends Model<IProduct> {
  findOrCreate(url: string, productData: Partial<IProduct>): Promise<{ product: IProduct; isNew: boolean }>;
  getTopSustainable(category?: string, limit?: number): Promise<IProduct[]>;
}

export const Product = mongoose.model<IProduct, IProductModel>('Product', ProductSchema);
