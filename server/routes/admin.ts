import { Router, Response } from 'express';
import db from '../db';
import { AuthRequest, authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// Admin stats overview
router.get('/stats', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];

    // Active users (users who logged practice in last 30 days)
    const activeUsers = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM practice_logs
      WHERE date(started_at) >= ?
    `).get(startDate) as any;

    // Total users
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role != "admin"').get() as any;

    // Average daily practice per user
    const avgPractice = db.prepare(`
      SELECT COALESCE(AVG(daily_total), 0) as avg_duration
      FROM (
        SELECT user_id, SUM(duration) as daily_total
        FROM practice_logs
        WHERE date(started_at) >= ?
        GROUP BY user_id, date(started_at)
      )
    `).get(startDate) as any;

    // Instrument distribution
    const instrumentDist = db.prepare(`
      SELECT instrument, COUNT(*) as count
      FROM users
      WHERE role != 'admin'
      GROUP BY instrument
      ORDER BY count DESC
    `).all();

    // Daily active users trend (last 30 days)
    const dailyActive = db.prepare(`
      SELECT date(started_at) as date, COUNT(DISTINCT user_id) as count
      FROM practice_logs
      WHERE date(started_at) >= ?
      GROUP BY date(started_at)
      ORDER BY date(started_at)
    `).all(startDate);

    // Total practice hours
    const totalHours = db.prepare(`
      SELECT COALESCE(SUM(duration), 0) as total
      FROM practice_logs
      WHERE date(started_at) >= ?
    `).get(startDate) as any;

    // Top instruments by practice time
    const instrumentPractice = db.prepare(`
      SELECT instrument, SUM(duration) as total_duration
      FROM practice_logs
      WHERE date(started_at) >= ?
      GROUP BY instrument
      ORDER BY total_duration DESC
    `).all(startDate);

    res.json({
      activeUsers: activeUsers.count,
      totalUsers: totalUsers.count,
      avgPracticeMinutes: Math.round(avgPractice.avg_duration || 0),
      totalPracticeHours: Math.round((totalHours.total || 0) / 60),
      instrumentDist,
      dailyActive,
      instrumentPractice
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users list (admin)
router.get('/users', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const users = db.prepare(`
      SELECT u.id, u.username, u.instrument, u.daily_goal, u.role, u.created_at,
        COALESCE(SUM(pl.duration), 0) as total_practice,
        COUNT(pl.id) as total_sessions
      FROM users u
      LEFT JOIN practice_logs pl ON u.id = pl.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `).all();

    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
