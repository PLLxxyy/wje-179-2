import { useState } from 'react';
import { authAPI } from '../utils/api';

type Page = 'login' | 'register' | 'home' | 'practice' | 'leaderboard' | 'community' | 'profile' | 'admin';

interface LoginPageProps {
  onLogin: (token: string, user: any) => void;
  onNavigate: (page: Page) => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

export default function LoginPage({ onLogin, onNavigate, showToast }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      showToast('error', '请填写用户名和密码');
      return;
    }
    setLoading(true);
    try {
      const data = await authAPI.login(username, password);
      onLogin(data.token, data.user);
    } catch (err: any) {
      showToast('error', err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>🎵 练琴打卡</h1>
        <p className="subtitle">记录每一次练习，见证成长</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              className="form-input"
              type="text"
              placeholder="请输入用户名"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              className="form-input"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        <p className="auth-link">
          还没有账号？<a onClick={() => onNavigate('register')} style={{ cursor: 'pointer' }}>立即注册</a>
        </p>
        <div style={{ marginTop: 20, padding: '12px 16px', background: '#F8F9FE', borderRadius: 8, fontSize: 13, color: '#636E72' }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>测试账号：</div>
          <div>管理员: admin / admin123</div>
          <div>普通用户: xiaoming / 123456</div>
        </div>
      </div>
    </div>
  );
}
