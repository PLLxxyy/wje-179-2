import { Router, Response } from 'express';
import db from '../db';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// Get monthly leaderboard
router.get('/monthly', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;

    const leaderboard = db.prepare(`
      SELECT
        u.id,
        u.username,
        u.instrument,
        COALESCE(SUM(pl.duration), 0) as total_duration,
        COUNT(pl.id) as session_count
      FROM users u
      LEFT JOIN practice_logs pl ON u.id = pl.user_id AND strftime('%Y-%m', pl.started_at) = ?
      WHERE u.role != 'admin'
      GROUP BY u.id
      ORDER BY total_duration DESC
      LIMIT 50
    `).all(monthStr);

    // Add rank
    const ranked = (leaderboard as any[]).map((item, index) => ({
      ...item,
      rank: index + 1
    }));

    // Find current user rank
    const myRank = ranked.findIndex(r => r.id === req.userId);

    res.json({
      leaderboard: ranked,
      myRank: myRank >= 0 ? myRank + 1 : null,
      month: monthStr
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
