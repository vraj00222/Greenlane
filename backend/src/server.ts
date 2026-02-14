import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { analyzeProductWithAI } from './services/novita.js';
import { findEcoAlternatives, detectCategory, checkVectorAIHealth, type EcoProduct, type SearchResult } from './services/actian.js';
import { connectDatabase, getConnectionStatus } from './config/database.js';
import { Achievement } from './models/index.js';

// Import routes
import usersRouter from './routes/users.js';
import scansRouter from './routes/scans.js';
import achievementsRouter from './routes/achievements.js';
import productsRouter from './routes/products.js';
import notificationsRouter from './routes/notifications.js';

// Load environment variables
dotenv.config();

const app: ReturnType<typeof express> = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    // Allow chrome extensions
    if (origin.startsWith('chrome-extension://')) return callback(null, true);
    // Allow localhost
    if (origin.includes('localhost')) return callback(null, true);
    callback(null, true); // Allow all for development
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
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
  name: string;
  brand: string;
  price: string;
  ecoScore: number;
  url: string;
  certifications: string[];
  description: string;
  similarity?: number;
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
app.get('/health', async (_req: Request, res: Response) => {
  const dbStatus = getConnectionStatus();
  const vectorAIStatus = await checkVectorAIHealth();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.2.0',
    database: dbStatus,
    ai: {
      provider: 'Novita AI',
      model: process.env.NOVITA_MODEL || 'deepseek/deepseek_v3'
    },
    vectorAI: {
      available: vectorAIStatus,
      fallback: !vectorAIStatus ? 'Using curated alternatives' : null
    }
  });
});

// Mount API routes
app.use('/api/users', usersRouter);
app.use('/api/scans', scansRouter);
app.use('/api/achievements', achievementsRouter);
app.use('/api/products', productsRouter);
app.use('/api/notifications', notificationsRouter);

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

    // Get eco-friendly alternatives using VectorAI semantic search
    const category = detectCategory(product.productTitle);
    let alternatives: Alternative[] = [];
    
    // Only suggest alternatives if product isn't already very sustainable
    if (analysis.greenScore < 80) {
      const results = await findEcoAlternatives(product.productTitle, category, 3);
      alternatives = results.map(r => ({
        id: r.product.id,
        name: r.product.name,
        brand: r.product.brand,
        price: r.product.price,
        ecoScore: r.product.ecoScore,
        url: r.product.url,
        certifications: r.product.certifications,
        description: r.product.description,
        similarity: r.similarity
      }));
    }

    res.json({
      success: true,
      product,
      analysis,
      alternatives,
      category,
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

// ============================================
// START SERVER
// ============================================

async function startServer() {
  try {
    // Connect to MongoDB
    await connectDatabase();
    
    // Seed achievements if needed
    const achievementCount = await Achievement.countDocuments();
    if (achievementCount === 0) {
      console.log('📜 Seeding achievements...');
      await Achievement.seedAchievements();
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log(`
🌿 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   GreenLane API Server v0.2.0
   
   🚀 Running on: http://localhost:${PORT}
   📊 Health:     http://localhost:${PORT}/health
   🗄️  Database:   MongoDB (localhost:27017/greenlane)
   🤖 AI Model:   ${process.env.NOVITA_MODEL || 'deepseek/deepseek-r1-0528'}
   
   API Endpoints:
   ├─ GET  /health                    - Health check
   ├─ POST /api/analyze-product       - AI sustainability analysis
   ├─ POST /api/log-choice            - Log user choice
   │
   ├─ Users
   │  ├─ GET    /api/users/:id        - Get user
   │  ├─ POST   /api/users            - Create/get user
   │  ├─ PATCH  /api/users/:id        - Update user
   │  └─ GET    /api/users/leaderboard/top - Leaderboard
   │
   ├─ Scans
   │  ├─ POST   /api/scans            - Record scan
   │  ├─ GET    /api/scans/user/:id   - User history
   │  └─ PATCH  /api/scans/:id/choice - Update choice
   │
   ├─ Achievements
   │  ├─ GET    /api/achievements     - All achievements
   │  └─ GET    /api/achievements/user/:id - User achievements
   │
   └─ Products
      ├─ GET    /api/products/:id     - Get product
      └─ GET    /api/products/top/sustainable - Top products
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 🌿
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
