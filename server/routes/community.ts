import { Router, Request, Response } from 'express';
import db from '../db';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// Get all posts
router.get('/posts', (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, type, instrument } = req.query;
    const offset = ((page as number) - 1) * (limit as number);

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (type) {
      where += ' AND p.type = ?';
      params.push(type);
    }
    if (instrument) {
      where += ' AND p.instrument = ?';
      params.push(instrument);
    }

    const posts = db.prepare(`
      SELECT p.*, u.username, u.instrument as user_instrument
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
      ${where}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM community_posts p ${where}
    `).get(...params) as any;

    res.json({ posts, total: total.count, page: Number(page), limit: Number(limit) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create post
router.post('/posts', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { type, title, content, instrument, song } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: '标题和内容不能为空' });
    }

    const user = db.prepare('SELECT instrument FROM users WHERE id = ?').get(req.userId) as any;

    const result = db.prepare(
      'INSERT INTO community_posts (user_id, type, title, content, instrument, song) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.userId, type || '心得', title, content, instrument || user?.instrument || '', song || '');

    res.json({
      id: result.lastInsertRowid,
      message: '发布成功'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get single post with comments
router.get('/posts/:id', (req: Request, res: Response) => {
  try {
    const post = db.prepare(`
      SELECT p.*, u.username, u.instrument as user_instrument
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(req.params.id) as any;

    if (!post) return res.status(404).json({ error: '帖子不存在' });

    const comments = db.prepare(`
      SELECT c.*, u.username
      FROM post_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(req.params.id);

    res.json({ post, comments });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Like post
router.post('/posts/:id/like', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const existing = db.prepare('SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (existing) {
      db.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?').run(req.params.id, req.userId);
      db.prepare('UPDATE community_posts SET likes = MAX(0, likes - 1) WHERE id = ?').run(req.params.id);
      res.json({ liked: false });
    } else {
      db.prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)').run(req.params.id, req.userId);
      db.prepare('UPDATE community_posts SET likes = likes + 1 WHERE id = ?').run(req.params.id);
      res.json({ liked: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add comment
router.post('/posts/:id/comments', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: '评论内容不能为空' });

    const result = db.prepare('INSERT INTO post_comments (post_id, user_id, content) VALUES (?, ?, ?)')
      .run(req.params.id, req.userId, content);

    res.json({ id: result.lastInsertRowid, message: '评论成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
