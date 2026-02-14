import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { analyzeProductWithAI } from './services/novita';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['chrome-extension://*', 'http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  if (req.method === 'POST' && req.body) {
    console.log(`  Body: ${JSON.stringify(req.body).substring(0, 200)}...`);
  }
  next();
});

// Types
interface ProductData {
  productTitle: string;
  price: string;
  brand: string;
  imageUrl?: string;
  url: string;
  materials?: string;
}

interface Alternative {
  id: string;
  title: string;
  brand: string;
  price: number;
  greenScore: number;
  url: string;
  sustainabilityReason: string;
}

interface AnalysisResult {
  greenScore: number;
  rawScore: number;
  reasons: string[];
  positives: string[];
  negatives: string[];
  recommendation: string;
}

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    ai: {
      provider: 'Novita AI',
      model: process.env.NOVITA_MODEL || 'deepseek/deepseek-r1-0528'
    }
  });
});

// Analyze product sustainability
app.post('/api/analyze-product', async (req: Request, res: Response) => {
  try {
    const product: ProductData = req.body;

    if (!product.productTitle) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing product title' 
      });
      return;
    }

    console.log(`\n🌿 Analyzing product: "${product.productTitle.substring(0, 50)}..."`);

    // Try AI analysis first
    let analysis: AnalysisResult;
    
    try {
      analysis = await analyzeProductWithAI(product);
      console.log(`✅ AI analysis complete - Score: ${analysis.greenScore}`);
    } catch (aiError) {
      console.error('⚠️ AI analysis failed, using fallback:', aiError);
      // Fallback to heuristic analysis
      analysis = getHeuristicAnalysis(product);
    }

    // Apply keyword adjustments
    const adjustedScore = applyKeywordAdjustments(analysis.greenScore, product);
    analysis.greenScore = Math.max(0, Math.min(100, adjustedScore));

    // Mock alternatives (will be replaced with VectorAI in Phase 10)
    const alternatives: Alternative[] = getMockAlternatives(product, analysis.greenScore);

    res.json({
      success: true,
      product,
      analysis,
      alternatives,
      analyzedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error analyzing product:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to analyze product' 
    });
  }
});

// Log user choice (placeholder for Phase 7)
app.post('/api/log-choice', (req: Request, res: Response) => {
  const { productUrl, action, greenScore } = req.body;
  
  console.log(`📊 Choice logged: ${action} for score ${greenScore}`);
  
  // TODO: Save to MongoDB in Phase 6
  res.json({
    success: true,
    message: 'Choice logged',
    data: { productUrl, action, greenScore }
  });
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function applyKeywordAdjustments(baseScore: number, product: ProductData): number {
  let score = baseScore;
  const text = `${product.productTitle} ${product.materials || ''} ${product.brand}`.toLowerCase();

  // Positive keywords
  if (text.includes('recycled')) score += 10;
  if (text.includes('organic')) score += 8;
  if (text.includes('sustainable')) score += 7;
  if (text.includes('eco-friendly') || text.includes('eco friendly')) score += 7;
  if (text.includes('bamboo')) score += 6;
  if (text.includes('biodegradable')) score += 8;
  if (text.includes('fair trade')) score += 5;
  if (text.includes('carbon neutral')) score += 10;

  // Negative keywords
  if (text.includes('plastic') && !text.includes('recycled plastic')) score -= 8;
  if (text.includes('synthetic')) score -= 5;
  if (text.includes('polyester') && !text.includes('recycled polyester')) score -= 5;
  if (text.includes('pvc')) score -= 10;
  if (text.includes('fast fashion')) score -= 10;

  return score;
}

function getHeuristicAnalysis(product: ProductData): AnalysisResult {
  // Fallback analysis when AI is unavailable
  let score = 50; // Base score
  const reasons: string[] = [];
  const positives: string[] = [];
  const negatives: string[] = [];

  const text = `${product.productTitle} ${product.materials || ''}`.toLowerCase();

  // Analyze text for sustainability indicators
  if (text.includes('recycled')) {
    score += 15;
    positives.push('Contains recycled materials');
  }
  if (text.includes('organic')) {
    score += 12;
    positives.push('Uses organic materials');
  }
  if (text.includes('sustainable')) {
    score += 10;
    positives.push('Marketed as sustainable');
  }
  if (text.includes('plastic')) {
    score -= 10;
    negatives.push('Contains plastic components');
  }
  if (text.includes('synthetic')) {
    score -= 8;
    negatives.push('Uses synthetic materials');
  }

  if (positives.length === 0) {
    reasons.push('Limited sustainability information available');
  }
  if (negatives.length === 0 && positives.length > 0) {
    reasons.push('Product shows some eco-friendly attributes');
  }
  
  reasons.push('Analysis based on product description keywords');
  reasons.push('Full AI analysis unavailable - using heuristic scoring');

  return {
    greenScore: Math.max(0, Math.min(100, score)),
    rawScore: score,
    reasons,
    positives: positives.length > 0 ? positives : ['No specific eco-friendly features detected'],
    negatives: negatives.length > 0 ? negatives : ['Sustainability details not provided'],
    recommendation: score >= 60 
      ? 'This product shows some sustainable qualities'
      : 'Consider looking for more eco-friendly alternatives'
  };
}

function getMockAlternatives(product: ProductData, currentScore: number): Alternative[] {
  // Return mock alternatives with higher scores
  // Will be replaced with VectorAI semantic search in Phase 10
  
  if (currentScore >= 80) {
    return []; // Already a great choice!
  }

  return [
    {
      id: 'alt_1',
      title: `Eco-Friendly ${product.productTitle.split(' ').slice(0, 3).join(' ')} Alternative`,
      brand: 'EcoChoice',
      price: parseFloat(product.price.replace(/[^0-9.]/g, '')) * 1.1 || 49.99,
      greenScore: Math.min(95, currentScore + 25),
      url: 'https://example.com/eco-alternative',
      sustainabilityReason: 'Made from 100% recycled materials with carbon-neutral shipping'
    }
  ];
}

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
🌿 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   GreenLane API Server
   
   🚀 Running on: http://localhost:${PORT}
   📊 Health:     http://localhost:${PORT}/health
   🤖 AI Model:   ${process.env.NOVITA_MODEL || 'deepseek/deepseek-r1-0528'}
   
   Endpoints:
   • GET  /health              - Health check
   • POST /api/analyze-product - Analyze product sustainability
   • POST /api/log-choice      - Log user shopping choice
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 🌿
  `);
});

export default app;
