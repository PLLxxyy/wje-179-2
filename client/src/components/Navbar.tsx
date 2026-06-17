interface User {
  id: number;
  username: string;
  instrument: string;
  daily_goal: number;
  role: string;
}

type Page = 'login' | 'register' | 'home' | 'practice' | 'leaderboard' | 'community' | 'profile' | 'admin';

interface NavbarProps {
  user: User;
  currentPage: Page;
  navigate: (page: Page) => void;
  onLogout: () => void;
}

const INSTRUMENT_ICONS: Record<string, string> = {
  '钢琴': '🎹',
  '吉他': '🎸',
  '小提琴': '🎻',
  '架子鼓': '🥁',
};

const NAV_ITEMS: { page: Page; label: string }[] = [
  { page: 'home', label: '首页' },
  { page: 'practice', label: '练习' },
  { page: 'leaderboard', label: '排行榜' },
  { page: 'community', label: '社区' },
  { page: 'profile', label: '我的' },
];

export default function Navbar({ user, currentPage, navigate, onLogout }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-logo">
          <span>{INSTRUMENT_ICONS[user.instrument] || '🎵'}</span>
          <span>练琴打卡</span>
        </div>

        <div className="navbar-links">
          {NAV_ITEMS.map(item => (
            <a
              key={item.page}
              className={currentPage === item.page ? 'active' : ''}
              onClick={() => navigate(item.page)}
              style={{ cursor: 'pointer' }}
            >
              {item.label}
            </a>
          ))}
          {user.role === 'admin' && (
            <a
              className={currentPage === 'admin' ? 'active' : ''}
              onClick={() => navigate('admin')}
              style={{ cursor: 'pointer' }}
            >
              管理后台
            </a>
          )}
        </div>

        <div className="navbar-user">
          <span className="username">{user.username}</span>
          <span style={{ fontSize: 12, color: '#636E72' }}>
            {INSTRUMENT_ICONS[user.instrument] || ''} {user.instrument}
          </span>
          <button className="btn-logout" onClick={onLogout}>退出</button>
        </div>
      </div>
    </nav>
  );
}
