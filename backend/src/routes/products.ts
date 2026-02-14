import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { Product } from '../models/index.js';

const router: RouterType = Router();

// ============================================
// GET /api/products/:id - Get product by ID
// ============================================
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch product' });
  }
});

// ============================================
// GET /api/products/url/:encodedUrl - Get product by URL
// ============================================
router.get('/url/:encodedUrl', async (req: Request, res: Response) => {
  try {
    const url = decodeURIComponent(req.params.encodedUrl);
    const product = await Product.findOne({ url });

    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Error fetching product by URL:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch product' });
  }
});

// ============================================
// GET /api/products/top/sustainable - Get top sustainable products
// ============================================
router.get('/top/sustainable', async (req: Request, res: Response) => {
  try {
    const { category, limit } = req.query;

    const products = await Product.getTopSustainable(
      category as string | undefined,
      limit ? parseInt(limit as string) : 10
    );

    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

// ============================================
// GET /api/products/stats/overview - Get product statistics
// ============================================
router.get('/stats/overview', async (_req: Request, res: Response) => {
  try {
    const stats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          avgGreenScore: { $avg: '$analysis.greenScore' },
          totalScans: { $sum: '$scanCount' },
          categoryBreakdown: { $push: '$category' },
        },
      },
    ]);

    if (stats.length === 0) {
      res.json({
        success: true,
        data: {
          totalProducts: 0,
          avgGreenScore: 0,
          totalScans: 0,
          categoryBreakdown: {},
        },
      });
      return;
    }

    // Calculate category breakdown
    const categoryCount = stats[0].categoryBreakdown.reduce(
      (acc: Record<string, number>, cat: string) => {
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      },
      {}
    );

    res.json({
      success: true,
      data: {
        totalProducts: stats[0].totalProducts,
        avgGreenScore: Math.round(stats[0].avgGreenScore * 10) / 10,
        totalScans: stats[0].totalScans,
        categoryBreakdown: categoryCount,
      },
    });
  } catch (error) {
    console.error('Error fetching product stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// ============================================
// POST /api/products/alternatives - Find eco alternatives on Amazon
// ============================================
router.post('/alternatives', async (req: Request, res: Response) => {
  try {
    const { productName, category, brand } = req.body;

    if (!productName) {
      res.status(400).json({ success: false, error: 'Product name is required' });
      return;
    }

    // Generate eco-friendly search queries based on category
    const ecoKeywords: Record<string, string[]> = {
      electronics: ['eco-friendly', 'energy efficient', 'sustainable', 'recycled materials'],
      clothing: ['organic cotton', 'sustainable', 'eco-friendly', 'recycled materials', 'fair trade'],
      footwear: ['sustainable', 'eco-friendly', 'vegan', 'recycled materials'],
      beauty: ['organic', 'natural', 'eco-friendly', 'cruelty-free', 'sustainable'],
      home: ['eco-friendly', 'sustainable', 'bamboo', 'recycled', 'biodegradable'],
      kitchen: ['eco-friendly', 'sustainable', 'bamboo', 'reusable', 'compostable'],
      sports: ['eco-friendly', 'sustainable', 'recycled materials', 'organic'],
      default: ['eco-friendly', 'sustainable', 'green', 'environmentally friendly']
    };

    // Detect category from product name if not provided
    const productLower = productName.toLowerCase();
    let detectedCategory = category || 'default';
    
    if (!category) {
      if (productLower.includes('shoe') || productLower.includes('sneaker') || productLower.includes('boot')) {
        detectedCategory = 'footwear';
      } else if (productLower.includes('shirt') || productLower.includes('pants') || productLower.includes('dress') || productLower.includes('jacket')) {
        detectedCategory = 'clothing';
      } else if (productLower.includes('phone') || productLower.includes('laptop') || productLower.includes('gpu') || productLower.includes('computer')) {
        detectedCategory = 'electronics';
      } else if (productLower.includes('cup') || productLower.includes('bottle') || productLower.includes('kitchen') || productLower.includes('container')) {
        detectedCategory = 'kitchen';
      }
    }

    const keywords = ecoKeywords[detectedCategory] || ecoKeywords.default;
    
    // Extract product type (remove brand and model specifics)
    const productType = productName
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .filter((word: string) => word.length > 2 && !word.match(/^\d+$/))
      .slice(0, 3)
      .join(' ');

    // Generate alternative search suggestions
    const alternatives = keywords.slice(0, 4).map((keyword, index) => {
      const searchQuery = `${keyword} ${productType}`;
      const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}`;
      
      return {
        id: `alt-${index}`,
        name: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} ${productType}`,
        searchQuery,
        url: amazonUrl,
        ecoScore: 70 + Math.floor(Math.random() * 20), // Estimated score 70-90
        keyword,
        description: `Shop for ${keyword} alternatives on Amazon`
      };
    });

    res.json({
      success: true,
      data: {
        originalProduct: productName,
        category: detectedCategory,
        alternatives
      }
    });
  } catch (error) {
    console.error('Error finding alternatives:', error);
    res.status(500).json({ success: false, error: 'Failed to find alternatives' });
  }
});

// ============================================
// GET /api/products/search - Search products
// ============================================
router.get('/search/query', async (req: Request, res: Response) => {
  try {
    const { q, category, minScore, maxScore, limit, offset } = req.query;

    const query: Record<string, unknown> = {};

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (minScore || maxScore) {
      query['analysis.greenScore'] = {};
      if (minScore) (query['analysis.greenScore'] as Record<string, number>).$gte = parseInt(minScore as string);
      if (maxScore) (query['analysis.greenScore'] as Record<string, number>).$lte = parseInt(maxScore as string);
    }

    const products = await Product.find(query)
      .sort({ 'analysis.greenScore': -1, scanCount: -1 })
      .skip(offset ? parseInt(offset as string) : 0)
      .limit(Math.min(limit ? parseInt(limit as string) : 20, 100));

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: {
        products,
        total,
        hasMore: total > (offset ? parseInt(offset as string) : 0) + products.length,
      },
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ success: false, error: 'Failed to search products' });
  }
});

export default router;
