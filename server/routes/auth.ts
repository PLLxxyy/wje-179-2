import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db';
import { generateToken, AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// Register
router.post('/register', (req: Request, res: Response) => {
  try {
    const { username, password, instrument, daily_goal } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    if (username.length < 2 || username.length > 20) {
      return res.status(400).json({ error: '用户名长度需在2-20个字符之间' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度至少6个字符' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const hashed = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (username, password, instrument, daily_goal) VALUES (?, ?, ?, ?)'
    ).run(username, hashed, instrument || '钢琴', daily_goal || 30);

    const token = generateToken(result.lastInsertRowid as number, 'user');
    res.json({
      token,
      user: {
        id: result.lastInsertRowid,
        username,
        instrument: instrument || '钢琴',
        daily_goal: daily_goal || 30,
        role: 'user'
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || '注册失败' });
  }
});

// Login
router.post('/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    if (!user) {
      return res.status(400).json({ error: '用户名或密码错误' });
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: '用户名或密码错误' });
    }

    const token = generateToken(user.id, user.role);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        instrument: user.instrument,
        daily_goal: user.daily_goal,
        role: user.role,
        bio: user.bio
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || '登录失败' });
  }
});

// Get current user info
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const user = db.prepare('SELECT id, username, instrument, daily_goal, role, bio, created_at FROM users WHERE id = ?').get(req.userId) as any;
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update profile
router.put('/profile', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { instrument, daily_goal, bio } = req.body;
    db.prepare('UPDATE users SET instrument = COALESCE(?, instrument), daily_goal = COALESCE(?, daily_goal), bio = COALESCE(?, bio) WHERE id = ?')
      .run(instrument, daily_goal, bio, req.userId);
    const user = db.prepare('SELECT id, username, instrument, daily_goal, role, bio FROM users WHERE id = ?').get(req.userId);
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
