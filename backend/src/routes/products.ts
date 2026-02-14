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
