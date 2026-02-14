import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { User, IUser } from '../models/index.js';
import mongoose from 'mongoose';

const router: RouterType = Router();

// ============================================
// GET /api/users/:id - Get user by ID
// ============================================
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: 'Invalid user ID' });
      return;
    }

    const user = await User.findById(id).populate('achievements');

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

// ============================================
// GET /api/users/extension/:extensionId - Get user by extension ID
// ============================================
router.get('/extension/:extensionId', async (req: Request, res: Response) => {
  try {
    const { extensionId } = req.params;

    const user = await User.findOne({ extensionId }).populate('achievements');

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user by extension ID:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

// ============================================
// POST /api/users - Create or get user
// ============================================
router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, displayName, extensionId, avatar } = req.body;

    if (!email || !displayName) {
      res.status(400).json({ 
        success: false, 
        error: 'Email and displayName are required' 
      });
      return;
    }

    // Check if user exists by email or extensionId
    let user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        ...(extensionId ? [{ extensionId }] : []),
      ],
    });

    if (user) {
      // Update extensionId if provided and not set
      if (extensionId && !user.extensionId) {
        user.extensionId = extensionId;
        await user.save();
      }
      res.json({ success: true, data: user, isNew: false });
      return;
    }

    // Create new user
    user = await User.create({
      email: email.toLowerCase(),
      displayName,
      extensionId,
      avatar,
    });

    console.log(`✅ New user created: ${user.email}`);
    res.status(201).json({ success: true, data: user, isNew: true });
  } catch (error: unknown) {
    console.error('Error creating user:', error);
    
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ 
        success: false, 
        error: 'User with this email already exists' 
      });
      return;
    }

    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

// ============================================
// PATCH /api/users/:id - Update user
// ============================================
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: 'Invalid user ID' });
      return;
    }

    // Prevent updating sensitive fields
    delete updates._id;
    delete updates.createdAt;
    delete updates.email; // Email changes should be separate

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

// ============================================
// GET /api/users/:id/stats - Get user stats
// ============================================
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: 'Invalid user ID' });
      return;
    }

    const user = await User.findById(id).select('stats displayName avatar');

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({ success: true, data: user.stats });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// ============================================
// GET /api/users/leaderboard - Get leaderboard
// ============================================
router.get('/leaderboard/top', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    
    const leaderboard = await User.getLeaderboard(limit);

    res.json({ 
      success: true, 
      data: leaderboard.map((user, index) => ({
        rank: index + 1,
        id: user._id,
        displayName: user.displayName,
        avatar: user.avatar,
        stats: {
          averageScore: user.stats.averageScore,
          totalScans: user.stats.totalScans,
          carbonSaved: user.stats.carbonSaved,
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
  }
});

export default router;
