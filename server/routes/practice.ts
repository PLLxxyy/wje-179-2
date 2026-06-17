import { Router, Response } from 'express';
import db from '../db';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// Start practice session - returns a session token (just a marker)
router.post('/start', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const startedAt = new Date().toISOString();
    res.json({ startedAt, message: '练习开始计时' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// End practice and create log
router.post('/end', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { startedAt, endedAt, song, notes } = req.body;
    if (!startedAt || !endedAt) {
      return res.status(400).json({ error: '缺少开始或结束时间' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any;
    if (!user) return res.status(404).json({ error: '用户不存在' });

    const start = new Date(startedAt);
    const end = new Date(endedAt);
    const duration = Math.round((end.getTime() - start.getTime()) / 60000); // minutes

    if (duration < 1) {
      return res.status(400).json({ error: '练习时间太短，至少1分钟' });
    }

    const result = db.prepare(
      'INSERT INTO practice_logs (user_id, instrument, duration, song, notes, started_at, ended_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(req.userId, user.instrument, duration, song || '', notes || '', startedAt, endedAt);

    // Update or create checkin record for today
    const today = new Date().toISOString().split('T')[0];
    const existingCheckin = db.prepare('SELECT * FROM checkin_records WHERE user_id = ? AND date = ?').get(req.userId, today) as any;

    if (existingCheckin) {
      const newTotal = existingCheckin.total_duration + duration;
      const goalMet = newTotal >= user.daily_goal ? 1 : 0;
      db.prepare('UPDATE checkin_records SET total_duration = ?, goal_met = ? WHERE id = ?')
        .run(newTotal, goalMet, existingCheckin.id);
    } else {
      const goalMet = duration >= user.daily_goal ? 1 : 0;
      db.prepare('INSERT INTO checkin_records (user_id, date, total_duration, goal_met) VALUES (?, ?, ?, ?)')
        .run(req.userId, today, duration, goalMet);
    }

    res.json({
      id: result.lastInsertRowid,
      duration,
      message: `本次练习${duration}分钟，已提交打卡`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get today's checkin status
router.get('/today', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const checkin = db.prepare('SELECT * FROM checkin_records WHERE user_id = ? AND date = ?').get(req.userId, today);
    const user = db.prepare('SELECT daily_goal FROM users WHERE id = ?').get(req.userId) as any;
    const logs = db.prepare('SELECT * FROM practice_logs WHERE user_id = ? AND date(started_at) = ? ORDER BY started_at DESC').all(req.userId, today);

    const dayOfWeek = new Date().getDay() || 7;
    const plan = db.prepare('SELECT * FROM practice_plans WHERE user_id = ? AND day_of_week = ?').get(req.userId, dayOfWeek) as any;

    res.json({
      checkin: checkin || null,
      daily_goal: user?.daily_goal || 30,
      todayLogs: logs,
      todayPlan: plan ? { duration: plan.duration, songs: plan.songs } : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get weekly calendar data
router.get('/week', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + 1);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const records = db.prepare(`
      SELECT * FROM checkin_records
      WHERE user_id = ? AND date >= ? AND date <= ?
      ORDER BY date
    `).all(req.userId, monday.toISOString().split('T')[0], sunday.toISOString().split('T')[0]);

    const user = db.prepare('SELECT daily_goal FROM users WHERE id = ?').get(req.userId) as any;

    const plans = db.prepare('SELECT * FROM practice_plans WHERE user_id = ? ORDER BY day_of_week').all(req.userId) as any[];

    const weekData = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const record = (records as any[]).find(r => r.date === dateStr);
      const dayPlan = plans.find(p => p.day_of_week === i + 1);
      weekData.push({
        date: dateStr,
        day: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i],
        total_duration: record?.total_duration || 0,
        goal_met: record?.goal_met || 0,
        isToday: dateStr === now.toISOString().split('T')[0],
        isFuture: d > now,
        planDuration: dayPlan?.duration || 0,
        planSongs: dayPlan?.songs || '',
      });
    }

    // Calculate streak
    const today = now.toISOString().split('T')[0];
    let streak = 0;
    const allRecords = db.prepare(`
      SELECT date, goal_met FROM checkin_records
      WHERE user_id = ? AND date <= ?
      ORDER BY date DESC
    `).all(req.userId, today) as any[];

    for (const rec of allRecords) {
      if (rec.goal_met) {
        streak++;
      } else {
        break;
      }
    }

    res.json({
      weekData,
      streak,
      daily_goal: user?.daily_goal || 30
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get practice history
router.get('/history', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = ((page as number) - 1) * (limit as number);

    const logs = db.prepare(`
      SELECT * FROM practice_logs
      WHERE user_id = ?
      ORDER BY started_at DESC
      LIMIT ? OFFSET ?
    `).all(req.userId, limit, offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM practice_logs WHERE user_id = ?').get(req.userId) as any;

    res.json({ logs, total: total.count, page: Number(page), limit: Number(limit) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get practice stats
router.get('/stats', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { period = 'week' } = req.query; // week, month, year
    const now = new Date();
    let startDate: string;

    if (period === 'week') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      startDate = d.toISOString().split('T')[0];
    } else if (period === 'month') {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      startDate = d.toISOString().split('T')[0];
    } else {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      startDate = d.toISOString().split('T')[0];
    }

    // Daily totals for trend chart
    const dailyTotals = db.prepare(`
      SELECT date, SUM(duration) as total
      FROM practice_logs
      WHERE user_id = ? AND date(started_at) >= ?
      GROUP BY date(started_at)
      ORDER BY date(started_at)
    `).all(req.userId, startDate);

    // Song distribution for pie chart
    const songDistribution = db.prepare(`
      SELECT
        CASE WHEN song = '' OR song IS NULL THEN '未命名曲目' ELSE song END as song,
        SUM(duration) as total
      FROM practice_logs
      WHERE user_id = ? AND date(started_at) >= ?
      GROUP BY song
      ORDER BY total DESC
    `).all(req.userId, startDate);

    // Total stats
    const totalStats = db.prepare(`
      SELECT
        COALESCE(SUM(duration), 0) as total_duration,
        COUNT(*) as total_sessions
      FROM practice_logs
      WHERE user_id = ?
    `).get(req.userId) as any;

    // Best streak
    const allCheckins = db.prepare(`
      SELECT date, goal_met FROM checkin_records
      WHERE user_id = ?
      ORDER BY date
    `).all(req.userId) as any[];

    let bestStreak = 0;
    let currentStreak = 0;
    for (const rec of allCheckins) {
      if (rec.goal_met) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    res.json({
      dailyTotals,
      songDistribution,
      totalStats,
      bestStreak,
      period
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/plan', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const plans = db.prepare('SELECT * FROM practice_plans WHERE user_id = ? ORDER BY day_of_week').all(req.userId) as any[];
    const result = [1, 2, 3, 4, 5, 6, 7].map(dow => {
      const plan = plans.find(p => p.day_of_week === dow);
      return {
        day_of_week: dow,
        duration: plan?.duration || 0,
        songs: plan?.songs || '',
      };
    });
    res.json({ plans: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/plan', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { plans } = req.body;
    if (!Array.isArray(plans)) {
      return res.status(400).json({ error: '数据格式错误' });
    }

    const upsert = db.prepare(`
      INSERT INTO practice_plans (user_id, day_of_week, duration, songs, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, day_of_week) DO UPDATE SET
        duration = excluded.duration,
        songs = excluded.songs,
        updated_at = CURRENT_TIMESTAMP
    `);

    const transaction = db.transaction(() => {
      for (const plan of plans) {
        const dow = plan.day_of_week;
        if (dow < 1 || dow > 7) continue;
        upsert.run(req.userId!, dow, plan.duration || 0, plan.songs || '');
      }
    });

    transaction();

    const updated = db.prepare('SELECT * FROM practice_plans WHERE user_id = ? ORDER BY day_of_week').all(req.userId) as any[];
    const result = [1, 2, 3, 4, 5, 6, 7].map(dow => {
      const plan = updated.find(p => p.day_of_week === dow);
      return {
        day_of_week: dow,
        duration: plan?.duration || 0,
        songs: plan?.songs || '',
      };
    });
    res.json({ plans: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
