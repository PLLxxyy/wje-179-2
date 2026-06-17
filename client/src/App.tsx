import { useState, useEffect, useCallback } from 'react';
import { authAPI, setToken, removeToken, isLoggedIn } from './utils/api';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import PracticePage from './pages/PracticePage';
import LeaderboardPage from './pages/LeaderboardPage';
import CommunityPage from './pages/CommunityPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';

interface User {
  id: number;
  username: string;
  instrument: string;
  daily_goal: number;
  role: string;
  bio?: string;
}

type Page = 'login' | 'register' | 'home' | 'practice' | 'leaderboard' | 'community' | 'profile' | 'admin';

function App() {
  const [page, setPage] = useState<Page>('login');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<{ id: number; type: 'success' | 'error'; message: string }[]>([]);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  // Check if user is logged in on mount
  useEffect(() => {
    if (isLoggedIn()) {
      authAPI.getMe()
        .then((data) => {
          setUser(data);
          setPage('home');
        })
        .catch(() => {
          removeToken();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (token: string, userData: User) => {
    setToken(token);
    setUser(userData);
    setPage('home');
    showToast('success', '登录成功！');
  };

  const handleLogout = () => {
    removeToken();
    setUser(null);
    setPage('login');
  };

  const navigate = (p: Page) => {
    setPage(p);
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading" style={{ marginTop: 200 }}>加载中</div>
      </div>
    );
  }

  // Auth pages
  if (!user) {
    return (
      <>
        {page === 'register' ? (
          <RegisterPage onLogin={handleLogin} onNavigate={navigate} showToast={showToast} />
        ) : (
          <LoginPage onLogin={handleLogin} onNavigate={navigate} showToast={showToast} />
        )}
      </>
    );
  }

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <HomePage user={user} navigate={navigate} showToast={showToast} />;
      case 'practice':
        return <PracticePage user={user} showToast={showToast} />;
      case 'leaderboard':
        return <LeaderboardPage />;
      case 'community':
        return <CommunityPage user={user} showToast={showToast} />;
      case 'profile':
        return <ProfilePage user={user} setUser={setUser} showToast={showToast} />;
      case 'admin':
        return user.role === 'admin' ? <AdminPage /> : <HomePage user={user} navigate={navigate} showToast={showToast} />;
      default:
        return <HomePage user={user} navigate={navigate} showToast={showToast} />;
    }
  };

  return (
    <div className="app-container">
      <Navbar user={user} currentPage={page} navigate={navigate} onLogout={handleLogout} />
      <div className="main-content">
        {renderPage()}
      </div>
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
