import express from 'express';
import cors from 'cors';
import { initDB } from './db';
import authRoutes from './routes/auth';
import practiceRoutes from './routes/practice';
import communityRoutes from './routes/community';
import leaderboardRoutes from './routes/leaderboard';
import adminRoutes from './routes/admin';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[Server] 音乐练习打卡平台后端已启动: http://localhost:${PORT}`);
});
