import { useState } from 'react';
import { authAPI } from '../utils/api';

type Page = 'login' | 'register' | 'home' | 'practice' | 'leaderboard' | 'community' | 'profile' | 'admin';

interface RegisterPageProps {
  onLogin: (token: string, user: any) => void;
  onNavigate: (page: Page) => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

const INSTRUMENTS = ['钢琴', '吉他', '小提琴', '架子鼓'];

export default function RegisterPage({ onLogin, onNavigate, showToast }: RegisterPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [instrument, setInstrument] = useState('钢琴');
  const [dailyGoal, setDailyGoal] = useState(30);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      showToast('error', '请填写用户名和密码');
      return;
    }
    if (password !== confirmPassword) {
      showToast('error', '两次输入的密码不一致');
      return;
    }
    setLoading(true);
    try {
      const data = await authAPI.register({ username, password, instrument, daily_goal: dailyGoal });
      onLogin(data.token, data.user);
    } catch (err: any) {
      showToast('error', err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>🎵 加入练琴打卡</h1>
        <p className="subtitle">开始你的音乐练习之旅</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              className="form-input"
              type="text"
              placeholder="2-20个字符"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              className="form-input"
              type="password"
              placeholder="至少6个字符"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">确认密码</label>
            <input
              className="form-input"
              type="password"
              placeholder="再次输入密码"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">学习乐器</label>
            <select
              className="form-select"
              value={instrument}
              onChange={e => setInstrument(e.target.value)}
            >
              {INSTRUMENTS.map(i => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">每日练习目标（分钟）</label>
            <select
              className="form-select"
              value={dailyGoal}
              onChange={e => setDailyGoal(Number(e.target.value))}
            >
              <option value={15}>15 分钟</option>
              <option value={30}>30 分钟</option>
              <option value={45}>45 分钟</option>
              <option value={60}>1 小时</option>
              <option value={90}>1.5 小时</option>
              <option value={120}>2 小时</option>
            </select>
          </div>
          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </button>
        </form>
        <p className="auth-link">
          已有账号？<a onClick={() => onNavigate('login')} style={{ cursor: 'pointer' }}>返回登录</a>
        </p>
      </div>
    </div>
  );
}
