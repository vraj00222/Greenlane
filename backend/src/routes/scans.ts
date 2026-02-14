import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { Scan, User, Product, Achievement, UserAchievement } from '../models/index.js';
import mongoose from 'mongoose';

const router: RouterType = Router();

// ============================================
// Helper: Check and award achievements
// ============================================
async function checkAndAwardAchievements(
  userId: mongoose.Types.ObjectId
): Promise<string[]> {
  const user = await User.findById(userId);
  if (!user) return [];

  const achievements = await Achievement.find();
  const existingAchievements = await UserAchievement.find({ user: userId });
  const existingCodes = new Set(
    existingAchievements.map(ua => ua.achievement.toString())
  );

  const newAchievements: string[] = [];

  for (const achievement of achievements) {
    // Skip if already earned
    if (existingCodes.has(achievement._id.toString())) continue;

    let earned = false;
    const { type, value, comparison } = achievement.requirement;

    // Check requirement based on type
    switch (type) {
      case 'scans':
        earned = compare(user.stats.totalScans, value, comparison);
        break;
      case 'score':
        earned = user.stats.totalScans >= 5 && compare(user.stats.averageScore, value, comparison);
        break;
      case 'carbon':
        earned = compare(user.stats.carbonSaved, value, comparison);
        break;
      case 'streak':
        earned = compare(user.stats.currentStreak, value, comparison);
        break;
      // Special achievements are awarded manually
    }

    if (earned) {
      await UserAchievement.create({
        user: userId,
        achievement: achievement._id,
      });

      // Increment unlock count
      await Achievement.findByIdAndUpdate(achievement._id, {
        $inc: { unlockedBy: 1 },
      });

      // Add to user's achievements array
      await User.findByIdAndUpdate(userId, {
        $addToSet: { achievements: achievement._id },
      });

      newAchievements.push(achievement.name);
      console.log(`🏆 User ${user.displayName} earned: ${achievement.name}`);
    }
  }

  return newAchievements;
}

function compare(actual: number, target: number, comparison: string): boolean {
  switch (comparison) {
    case 'gte': return actual >= target;
    case 'lte': return actual <= target;
    case 'eq': return actual === target;
    default: return false;
  }
}

// ============================================
// POST /api/scans - Record a new scan
// ============================================
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, productData, analysis } = req.body;

    if (!userId || !productData || !analysis) {
      res.status(400).json({
        success: false,
        error: 'userId, productData, and analysis are required',
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ success: false, error: 'Invalid user ID' });
      return;
    }

    // Find or create product
    const source = new URL(productData.url).hostname;
    const { product, isNew } = await Product.findOrCreate(productData.url, {
      title: productData.productTitle,
      brand: productData.brand || 'Unknown',
      price: productData.price,
      imageUrl: productData.imageUrl,
      materials: productData.materials,
      source,
      analysis: {
        greenScore: analysis.greenScore,
        rawScore: analysis.rawScore,
        reasons: analysis.reasons,
        positives: analysis.positives,
        negatives: analysis.negatives,
        recommendation: analysis.recommendation,
      },
    });

    if (isNew) {
      console.log(`📦 New product saved: ${product.title.substring(0, 40)}...`);
    }

    // Check if scan already exists for this user + product
    let scan = await Scan.findOne({
      user: userId,
      product: product._id,
    });

    if (scan) {
      // Update existing scan
      scan.greenScore = analysis.greenScore;
      scan.scannedAt = new Date();
      await scan.save();
    } else {
      // Create new scan
      scan = await Scan.create({
        user: userId,
        product: product._id,
        greenScore: analysis.greenScore,
      });
    }

    // Update user stats
    const user = await User.findById(userId);
    if (user) {
      // Update streak
      (user as unknown as { updateStreak: () => void }).updateStreak();
      
      // Update total scans
      user.stats.totalScans += 1;

      // Recalculate average score
      const allScans = await Scan.find({ user: userId });
      const totalScore = allScans.reduce((sum, s) => sum + s.greenScore, 0);
      user.stats.averageScore = Math.round((totalScore / allScans.length) * 10) / 10;

      await user.save();

      // Check for new achievements
      const newAchievements = await checkAndAwardAchievements(
        userId as unknown as mongoose.Types.ObjectId
      );

      res.status(201).json({
        success: true,
        data: {
          scan,
          product,
          userStats: user.stats,
          newAchievements,
        },
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: { scan, product },
    });
  } catch (error) {
    console.error('Error recording scan:', error);
    res.status(500).json({ success: false, error: 'Failed to record scan' });
  }
});

// ============================================
// GET /api/scans/user/:userId - Get user's scan history
// ============================================
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit, offset, startDate, endDate } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ success: false, error: 'Invalid user ID' });
      return;
    }

    const scans = await Scan.getUserHistory(
      new mongoose.Types.ObjectId(userId),
      {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      }
    );

    res.json({ success: true, data: scans });
  } catch (error) {
    console.error('Error fetching scan history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
});

// ============================================
// GET /api/scans/user/:userId/stats - Get user scan stats
// ============================================
router.get('/user/:userId/stats', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ success: false, error: 'Invalid user ID' });
      return;
    }

    const stats = await Scan.getUserStats(
      new mongoose.Types.ObjectId(userId)
    );

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching scan stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// ============================================
// GET /api/scans/user/:userId/weekly - Get weekly activity
// ============================================
router.get('/user/:userId/weekly', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ success: false, error: 'Invalid user ID' });
      return;
    }

    const activity = await Scan.getWeeklyActivity(
      new mongoose.Types.ObjectId(userId)
    );

    res.json({ success: true, data: activity });
  } catch (error) {
    console.error('Error fetching weekly activity:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch activity' });
  }
});

// ============================================
// PATCH /api/scans/:scanId/choice - Update user choice
// ============================================
router.patch('/:scanId/choice', async (req: Request, res: Response) => {
  try {
    const { scanId } = req.params;
    const { choice, alternativeId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(scanId)) {
      res.status(400).json({ success: false, error: 'Invalid scan ID' });
      return;
    }

    const validChoices = ['purchased', 'skipped', 'alternative', 'saved'];
    if (!validChoices.includes(choice)) {
      res.status(400).json({
        success: false,
        error: `Invalid choice. Must be one of: ${validChoices.join(', ')}`,
      });
      return;
    }

    const scan = await Scan.findById(scanId).populate('product');
    if (!scan) {
      res.status(404).json({ success: false, error: 'Scan not found' });
      return;
    }

    // Calculate carbon impact based on choice
    const product = scan.product as unknown as { analysis: { greenScore: number } };
    let carbonImpact = 0;

    if (choice === 'skipped' && product.analysis.greenScore < 50) {
      // User skipped a low-score product - positive impact
      carbonImpact = (50 - product.analysis.greenScore) * 0.1; // ~0.1-5kg saved
    } else if (choice === 'alternative') {
      // User chose an alternative - calculate based on score difference
      if (alternativeId && mongoose.Types.ObjectId.isValid(alternativeId)) {
        const alternative = await Product.findById(alternativeId);
        if (alternative) {
          const scoreDiff = alternative.analysis.greenScore - product.analysis.greenScore;
          carbonImpact = Math.max(0, scoreDiff * 0.05);
          scan.alternativeChosen = alternative._id as mongoose.Types.ObjectId;
        }
      }
    }

    scan.userChoice = choice;
    scan.carbonImpact = carbonImpact;
    await scan.save();

    // Update user's carbon saved
    if (carbonImpact > 0) {
      await User.findByIdAndUpdate(scan.user, {
        $inc: { 'stats.carbonSaved': carbonImpact },
      });
    }

    // Check for new achievements
    const newAchievements = await checkAndAwardAchievements(scan.user);

    res.json({
      success: true,
      data: {
        scan,
        carbonImpact,
        newAchievements,
      },
    });
  } catch (error) {
    console.error('Error updating choice:', error);
    res.status(500).json({ success: false, error: 'Failed to update choice' });
  }
});

export default router;
