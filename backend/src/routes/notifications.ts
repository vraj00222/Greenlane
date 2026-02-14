import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { Notification, User } from '../models/index.js';
import mongoose from 'mongoose';

const router: RouterType = Router();

// ============================================
// GET /api/notifications/user/:userId - Get user's notifications
// ============================================
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unread === 'true';

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ success: false, error: 'Invalid user ID' });
      return;
    }

    const query: Record<string, unknown> = { user: userId };
    if (unreadOnly) {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    const unreadCount = await Notification.countDocuments({
      user: userId,
      read: false,
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

// ============================================
// GET /api/notifications/user/:userId/count - Get unread count
// ============================================
router.get('/user/:userId/count', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ success: false, error: 'Invalid user ID' });
      return;
    }

    const unreadCount = await Notification.countDocuments({
      user: userId,
      read: false,
    });

    res.json({
      success: true,
      data: { unreadCount },
    });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch count' });
  }
});

// ============================================
// PATCH /api/notifications/:id/read - Mark notification as read
// ============================================
router.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: 'Invalid notification ID' });
      return;
    }

    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ success: false, error: 'Notification not found' });
      return;
    }

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: 'Failed to update notification' });
  }
});

// ============================================
// PATCH /api/notifications/user/:userId/read-all - Mark all as read
// ============================================
router.patch('/user/:userId/read-all', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ success: false, error: 'Invalid user ID' });
      return;
    }

    const result = await Notification.updateMany(
      { user: userId, read: false },
      { read: true }
    );

    res.json({
      success: true,
      data: { markedRead: result.modifiedCount },
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ success: false, error: 'Failed to update notifications' });
  }
});

// ============================================
// DELETE /api/notifications/:id - Delete notification
// ============================================
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: 'Invalid notification ID' });
      return;
    }

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      res.status(404).json({ success: false, error: 'Notification not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, error: 'Failed to delete notification' });
  }
});

export default router;
