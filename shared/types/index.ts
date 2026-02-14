// GreenLane Shared Types
// Used across extension, backend, and dashboard

export interface ProductData {
  productTitle: string;
  price: string;
  brand: string;
  imageUrl?: string;
  url: string;
  materials?: string;
  description?: string;
}

export interface SustainabilityAnalysis {
  greenScore: number; // 0-100
  rawScore: number; // Score before keyword adjustments
  reasons: string[];
  positives: string[];
  negatives: string[];
  recommendation: string;
}

export interface AlternativeProduct {
  id: string;
  title: string;
  brand: string;
  price: number;
  greenScore: number;
  imageUrl?: string;
  url: string;
  sustainabilityReason: string;
}

export interface AnalysisResponse {
  success: boolean;
  product: ProductData;
  analysis: SustainabilityAnalysis;
  alternatives: AlternativeProduct[];
  analyzedAt: string;
}

export interface UserChoice {
  userId: string;
  productUrl: string;
  action: 'bought' | 'alternative' | 'skipped';
  originalScore: number;
  chosenScore?: number;
  alternativeId?: string;
  timestamp: string;
}

export interface UserStats {
  totalChoices: number;
  greenChoices: number;
  avgScore: number;
  co2Prevented: number; // Estimated kg
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  threshold: number;
  unlockedAt?: string;
  nftMint?: string; // Solana NFT address
}

export interface DashboardData {
  user: {
    id: string;
    email: string;
  };
  stats: UserStats;
  achievements: Achievement[];
  recentChoices: UserChoice[];
}
