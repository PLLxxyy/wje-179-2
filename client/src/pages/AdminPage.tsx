import { useState, useEffect } from 'react';
import { adminAPI } from '../utils/api';

const PIE_COLORS = ['#6C5CE7', '#00CEC9', '#FD79A8', '#FDCB6E', '#00B894', '#FF6B6B'];

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [tab, setTab] = useState<'overview' | 'users'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, usersData] = await Promise.all([
        adminAPI.stats(),
        adminAPI.users()
      ]);
      setStats(statsData);
      setUsers(usersData.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分` : `${hours}小时`;
  };

  if (loading) return <div className="loading">加载中</div>;

  const instrumentDistTotal = stats?.instrumentDist?.reduce((sum: number, i: any) => sum + i.count, 0) || 1;
  const maxDailyActive = stats?.dailyActive?.length > 0
    ? Math.max(...stats.dailyActive.map((d: any) => d.count), 1)
    : 1;

  return (
    <div>
      <div className="page-header">
        <h1>📊 管理后台</h1>
        <p>平台运营数据概览</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>数据概览</button>
        <button className={`tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>用户管理</button>
      </div>

      {tab === 'overview' && stats && (
        <>
          {/* Key metrics */}
          <div className="admin-grid">
            <div className="admin-stat">
              <div className="icon">👥</div>
              <div className="value">{stats.activeUsers}</div>
              <div className="label">30天活跃用户</div>
            </div>
            <div className="admin-stat">
              <div className="icon">📝</div>
              <div className="value">{stats.totalUsers}</div>
              <div className="label">注册用户总数</div>
            </div>
            <div className="admin-stat">
              <div className="icon">⏱️</div>
              <div className="value">{stats.avgPracticeMinutes}</div>
              <div className="label">人均每日练习(分钟)</div>
            </div>
            <div className="admin-stat">
              <div className="icon">🎵</div>
              <div className="value">{stats.totalPracticeHours}</div>
              <div className="label">30天总练习(小时)</div>
            </div>
            <div className="admin-stat">
              <div className="icon">📈</div>
              <div className="value">{stats.dailyActive?.length || 0}</div>
              <div className="label">活跃天数</div>
            </div>
            <div className="admin-stat">
              <div className="icon">🏆</div>
              <div className="value">{stats.instrumentDist?.length || 0}</div>
              <div className="label">乐器种类</div>
            </div>
          </div>

          {/* Daily active users trend */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-title">📈 每日活跃用户趋势</div>
            {stats.dailyActive?.length > 0 ? (
              <div className="bar-chart">
                {stats.dailyActive.map((item: any, idx: number) => (
                  <div key={idx} className="bar-item">
                    <div className="bar-value">{item.count}</div>
                    <div className="bar" style={{
                      height: `${Math.max(5, (item.count / maxDailyActive) * 160)}px`,
                      background: 'linear-gradient(to top, var(--secondary), #00B894)'
                    }}></div>
                    <div className="bar-label">{item.date.split('-').slice(1).join('/')}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: 30 }}><p>暂无数据</p></div>
            )}
          </div>

          <div className="grid-2">
            {/* Instrument distribution */}
            <div className="card">
              <div className="card-title">🎸 乐器分布</div>
              {stats.instrumentDist?.map((item: any, idx: number) => (
                <div key={idx} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 14 }}>
                    <span>{item.instrument}</span>
                    <span style={{ fontWeight: 600 }}>{item.count}人 ({Math.round((item.count / instrumentDistTotal) * 100)}%)</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${(item.count / instrumentDistTotal) * 100}%`,
                      background: PIE_COLORS[idx % PIE_COLORS.length],
                      borderRadius: 4
                    }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Instrument by practice time */}
            <div className="card">
              <div className="card-title">⏱️ 各乐器练习时长</div>
              {stats.instrumentPractice?.map((item: any, idx: number) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: idx < stats.instrumentPractice.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <span>{item.instrument}</span>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatDuration(item.total_duration)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'users' && (
        <div className="card">
          <div className="card-title">👥 用户列表 ({users.length}人)</div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>用户名</th>
                  <th>乐器</th>
                  <th>每日目标</th>
                  <th>总练习时长</th>
                  <th>练习次数</th>
                  <th>注册时间</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td style={{ fontWeight: 600 }}>
                      {u.username}
                      {u.role === 'admin' && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--accent)' }}>管理员</span>}
                    </td>
                    <td>{u.instrument}</td>
                    <td>{u.daily_goal}分钟</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatDuration(u.total_practice)}</td>
                    <td>{u.total_sessions}次</td>
                    <td style={{ fontSize: 13, color: 'var(--text-light)' }}>{new Date(u.created_at).toLocaleDateString('zh-CN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
