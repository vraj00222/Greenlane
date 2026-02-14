import { Router, Request, Response } from 'express';
import { Achievement, UserAchievement, User } from '../models';
import mongoose from 'mongoose';

const router = Router();

// ============================================
// GET /api/achievements - Get all achievements
// ============================================
router.get('/', async (_req: Request, res: Response) => {
  try {
    const achievements = await Achievement.find().sort({ category: 1, xpReward: 1 });

    res.json({
      success: true,
      data: achievements,
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch achievements' });
  }
});

// ============================================
// GET /api/achievements/user/:userId - Get user's achievements
// ============================================
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ success: false, error: 'Invalid user ID' });
      return;
    }

    // Get all achievements
    const allAchievements = await Achievement.find();
    
    // Get user's earned achievements
    const userAchievements = await UserAchievement.find({ user: userId })
      .populate('achievement');

    const earnedIds = new Set(
      userAchievements.map(ua => (ua.achievement as unknown as { _id: mongoose.Types.ObjectId })._id.toString())
    );

    // Get user stats for progress calculation
    const user = await User.findById(userId);

    // Map achievements with earned status and progress
    const achievementsWithProgress = allAchievements.map(achievement => {
      const userAchievement = userAchievements.find(
        ua => (ua.achievement as unknown as { _id: mongoose.Types.ObjectId })._id.toString() === achievement._id.toString()
      );

      let progress = 0;
      if (user && !earnedIds.has(achievement._id.toString())) {
        // Calculate progress for unearned achievements
        const { type, value } = achievement.requirement;
        switch (type) {
          case 'scans':
            progress = Math.min(100, (user.stats.totalScans / value) * 100);
            break;
          case 'score':
            progress = user.stats.totalScans >= 5 
              ? Math.min(100, (user.stats.averageScore / value) * 100)
              : 0;
            break;
          case 'carbon':
            progress = Math.min(100, (user.stats.carbonSaved / value) * 100);
            break;
          case 'streak':
            progress = Math.min(100, (user.stats.currentStreak / value) * 100);
            break;
        }
      }

      return {
        id: achievement._id,
        code: achievement.code,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        category: achievement.category,
        rarity: achievement.rarity,
        xpReward: achievement.xpReward,
        unlockedBy: achievement.unlockedBy,
        earned: earnedIds.has(achievement._id.toString()),
        unlockedAt: userAchievement?.unlockedAt || null,
        progress: earnedIds.has(achievement._id.toString()) ? 100 : Math.round(progress),
      };
    });

    // Sort: earned first, then by progress
    achievementsWithProgress.sort((a, b) => {
      if (a.earned !== b.earned) return a.earned ? -1 : 1;
      return b.progress - a.progress;
    });

    res.json({
      success: true,
      data: {
        achievements: achievementsWithProgress,
        summary: {
          total: allAchievements.length,
          earned: earnedIds.size,
          totalXP: userAchievements.reduce(
            (sum, ua) => sum + ((ua.achievement as unknown as { xpReward: number }).xpReward || 0),
            0
          ),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch achievements' });
  }
});

// ============================================
// POST /api/achievements/seed - Seed achievements (admin)
// ============================================
router.post('/seed', async (_req: Request, res: Response) => {
  try {
    await Achievement.seedAchievements();
    
    const count = await Achievement.countDocuments();
    
    res.json({
      success: true,
      message: `Seeded ${count} achievements`,
    });
  } catch (error) {
    console.error('Error seeding achievements:', error);
    res.status(500).json({ success: false, error: 'Failed to seed achievements' });
  }
});

// ============================================
// POST /api/achievements/award/:userId/:code - Manually award achievement
// ============================================
router.post('/award/:userId/:code', async (req: Request, res: Response) => {
  try {
    const { userId, code } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ success: false, error: 'Invalid user ID' });
      return;
    }

    const achievement = await Achievement.findOne({ code: code.toUpperCase() });
    if (!achievement) {
      res.status(404).json({ success: false, error: 'Achievement not found' });
      return;
    }

    // Check if already earned
    const existing = await UserAchievement.findOne({
      user: userId,
      achievement: achievement._id,
    });

    if (existing) {
      res.status(409).json({
        success: false,
        error: 'Achievement already earned',
      });
      return;
    }

    // Award achievement
    await UserAchievement.create({
      user: userId,
      achievement: achievement._id,
    });

    // Update achievement unlock count
    await Achievement.findByIdAndUpdate(achievement._id, {
      $inc: { unlockedBy: 1 },
    });

    // Add to user's achievements
    await User.findByIdAndUpdate(userId, {
      $addToSet: { achievements: achievement._id },
    });

    console.log(`🏆 Manually awarded ${achievement.name} to user ${userId}`);

    res.json({
      success: true,
      data: achievement,
    });
  } catch (error) {
    console.error('Error awarding achievement:', error);
    res.status(500).json({ success: false, error: 'Failed to award achievement' });
  }
});

export default router;
