import { useState, useEffect } from 'react';
import { practiceAPI, authAPI } from '../utils/api';

interface User {
  id: number;
  username: string;
  instrument: string;
  daily_goal: number;
  role: string;
  bio?: string;
}

interface ProfilePageProps {
  user: User;
  setUser: (user: User) => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

interface DayPlan {
  day_of_week: number;
  duration: number;
  songs: string;
}

const INSTRUMENTS = ['钢琴', '吉他', '小提琴', '架子鼓'];
const INSTRUMENT_ICONS: Record<string, string> = {
  '钢琴': '🎹',
  '吉他': '🎸',
  '小提琴': '🎻',
  '架子鼓': '🥁',
};

const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const DAY_COLORS = ['#6C5CE7', '#00CEC9', '#FD79A8', '#FDCB6E', '#00B894', '#FF6B6B', '#A29BFE'];

const PIE_COLORS = ['#6C5CE7', '#00CEC9', '#FD79A8', '#FDCB6E', '#00B894', '#FF6B6B', '#A29BFE', '#74B9FF'];

export default function ProfilePage({ user, setUser, showToast }: ProfilePageProps) {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [stats, setStats] = useState<any>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editInstrument, setEditInstrument] = useState(user.instrument);
  const [editGoal, setEditGoal] = useState(user.daily_goal);
  const [editBio, setEditBio] = useState(user.bio || '');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPlan, setShowPlan] = useState(false);
  const [planData, setPlanData] = useState<DayPlan[]>(
    DAY_NAMES.map((_, i) => ({ day_of_week: i + 1, duration: 0, songs: '' }))
  );
  const [planLoading, setPlanLoading] = useState(false);
  const [planSaving, setPlanSaving] = useState(false);

  useEffect(() => {
    loadStats();
  }, [period]);

  useEffect(() => {
    loadPlan();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await practiceAPI.stats(period);
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPlan = async () => {
    setPlanLoading(true);
    try {
      const data = await practiceAPI.getPlan();
      setPlanData(data.plans);
    } catch (err) {
      console.error(err);
    } finally {
      setPlanLoading(false);
    }
  };

  const handleSavePlan = async () => {
    setPlanSaving(true);
    try {
      const data = await practiceAPI.savePlan(planData);
      setPlanData(data.plans);
      setShowPlan(false);
      showToast('success', '练习计划已保存');
    } catch (err: any) {
      showToast('error', err.message || '保存失败');
    } finally {
      setPlanSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await authAPI.updateProfile({
        instrument: editInstrument,
        daily_goal: editGoal,
        bio: editBio,
      });
      setUser({ ...user, ...updated });
      setShowEdit(false);
      showToast('success', '个人资料已更新');
    } catch (err: any) {
      showToast('error', err.message || '更新失败');
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分` : `${hours}小时`;
  };

  // Compute max value for bar chart
  const maxBarValue = stats?.dailyTotals?.length > 0
    ? Math.max(...stats.dailyTotals.map((d: any) => d.total), 1)
    : 1;

  // Pie chart total
  const pieTotal = stats?.songDistribution?.reduce((sum: number, s: any) => sum + s.total, 0) || 1;

  if (loading && !stats) return <div className="loading">加载中</div>;

  return (
    <div>
      {/* Profile header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div className="profile-info">
          <h2>{user.username}</h2>
          <p>{INSTRUMENT_ICONS[user.instrument]} {user.instrument} · 每日目标 {user.daily_goal} 分钟</p>
          {user.bio && <p style={{ marginTop: 4, fontSize: 13 }}>{user.bio}</p>}
        </div>
        <button className="btn btn-secondary" onClick={() => setShowEdit(true)} style={{ marginLeft: 'auto' }}>
          编辑资料
        </button>
      </div>

      {/* Practice Plan Summary */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>📅 每周练习计划</div>
          <button className="btn btn-secondary" onClick={() => { setShowPlan(true); loadPlan(); }} style={{ fontSize: 13, padding: '6px 14px' }}>
            设置计划
          </button>
        </div>
        <div className="plan-summary-grid">
          {planData.map((plan, idx) => {
            const hasPlan = plan.duration > 0 || plan.songs;
            return (
              <div key={plan.day_of_week} className={`plan-day-card ${hasPlan ? 'has-plan' : ''}`}>
                <div className="plan-day-name" style={{ color: DAY_COLORS[idx] }}>{DAY_NAMES[idx]}</div>
                <div className="plan-day-duration">
                  {plan.duration > 0 ? <>{plan.duration}<span className="plan-day-unit">分钟</span></> : <span className="plan-day-empty">—</span>}
                </div>
                {plan.songs && (
                  <div className="plan-day-songs" title={plan.songs}>
                    {plan.songs.length > 8 ? plan.songs.slice(0, 8) + '…' : plan.songs}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Overall stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">累计练习</div>
          <div className="stat-value" style={{ fontSize: 20 }}>{formatDuration(stats?.totalStats?.total_duration || 0)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">练习次数</div>
          <div className="stat-value" style={{ fontSize: 20 }}>{stats?.totalStats?.total_sessions || 0}次</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">最佳连续天数</div>
          <div className="stat-value" style={{ fontSize: 20, color: 'var(--accent)' }}>🔥 {stats?.bestStreak || 0}天</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">当前乐器</div>
          <div className="stat-value" style={{ fontSize: 20 }}>{INSTRUMENT_ICONS[user.instrument]} {user.instrument}</div>
        </div>
      </div>

      {/* Period tabs */}
      <div className="tabs">
        <button className={`tab ${period === 'week' ? 'active' : ''}`} onClick={() => setPeriod('week')}>本周</button>
        <button className={`tab ${period === 'month' ? 'active' : ''}`} onClick={() => setPeriod('month')}>本月</button>
        <button className={`tab ${period === 'year' ? 'active' : ''}`} onClick={() => setPeriod('year')}>今年</button>
      </div>

      {/* Trend chart (bar chart) */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">📈 练习时长趋势</div>
        {stats?.dailyTotals?.length > 0 ? (
          <div className="bar-chart">
            {stats.dailyTotals.map((item: any, idx: number) => (
              <div key={idx} className="bar-item">
                <div className="bar-value">{item.total}</div>
                <div className="bar" style={{ height: `${Math.max(5, (item.total / maxBarValue) * 160)}px` }}></div>
                <div className="bar-label">{item.date.split('-').slice(1).join('/')}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: 30 }}>
            <p>暂无练习数据</p>
          </div>
        )}
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>单位：分钟</div>
      </div>

      {/* Song distribution (pie chart using CSS) */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">🎯 曲目练习时长分布</div>
        {stats?.songDistribution?.length > 0 ? (
          <div className="pie-chart-container">
            {/* Simple CSS pie chart */}
            <div style={{
              width: 150,
              height: 150,
              borderRadius: '50%',
              background: `conic-gradient(${
                stats.songDistribution.map((s: any, i: number) => {
                  const start = stats.songDistribution.slice(0, i).reduce((sum: number, item: any) => sum + (item.total / pieTotal) * 100, 0);
                  const pct = (s.total / pieTotal) * 100;
                  return `${PIE_COLORS[i % PIE_COLORS.length]} ${start}% ${start + pct}%`;
                }).join(', ')
              })`,
              flexShrink: 0,
            }}></div>
            <div className="pie-legend">
              {stats.songDistribution.map((s: any, i: number) => (
                <div key={i} className="pie-legend-item">
                  <div className="pie-legend-color" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}></div>
                  <span>{s.song}</span>
                  <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{s.total}分钟</span>
                  <span style={{ marginLeft: 4, color: 'var(--text-muted)', fontSize: 12 }}>
                    ({Math.round((s.total / pieTotal) * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: 30 }}>
            <p>暂无曲目数据</p>
          </div>
        )}
      </div>

      {/* Edit profile modal */}
      {showEdit && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowEdit(false); }}>
          <div className="modal">
            <div className="modal-title">编辑个人资料</div>
            <div className="form-group">
              <label className="form-label">乐器</label>
              <select className="form-select" value={editInstrument} onChange={e => setEditInstrument(e.target.value)}>
                {INSTRUMENTS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">每日练习目标（分钟）</label>
              <select className="form-select" value={editGoal} onChange={e => setEditGoal(Number(e.target.value))}>
                <option value={15}>15 分钟</option>
                <option value={30}>30 分钟</option>
                <option value={45}>45 分钟</option>
                <option value={60}>1 小时</option>
                <option value={90}>1.5 小时</option>
                <option value={120}>2 小时</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">个人简介</label>
              <textarea
                className="form-textarea"
                placeholder="介绍一下自己..."
                value={editBio}
                onChange={e => setEditBio(e.target.value)}
                rows={3}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowEdit(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Practice Plan Edit Modal */}
      {showPlan && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowPlan(false); }}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-title">📅 设置每周练习计划</div>
            <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 20 }}>
              为每天的练习设定目标时长和计划曲目，帮助你养成规律的练习习惯。
            </p>
            {planLoading ? (
              <div className="loading">加载中</div>
            ) : (
              <div className="plan-edit-list">
                {planData.map((plan, idx) => (
                  <div key={plan.day_of_week} className="plan-edit-row">
                    <div className="plan-edit-day" style={{ background: DAY_COLORS[idx], color: '#fff' }}>
                      {DAY_NAMES[idx]}
                    </div>
                    <div className="plan-edit-fields">
                      <div className="plan-edit-field">
                        <label className="plan-edit-label">时长</label>
                        <select
                          className="form-select plan-edit-select"
                          value={plan.duration}
                          onChange={e => {
                            const next = [...planData];
                            next[idx] = { ...next[idx], duration: Number(e.target.value) };
                            setPlanData(next);
                          }}
                        >
                          <option value={0}>休息</option>
                          <option value={15}>15 分钟</option>
                          <option value={30}>30 分钟</option>
                          <option value={45}>45 分钟</option>
                          <option value={60}>1 小时</option>
                          <option value={90}>1.5 小时</option>
                          <option value={120}>2 小时</option>
                        </select>
                      </div>
                      <div className="plan-edit-field" style={{ flex: 2 }}>
                        <label className="plan-edit-label">曲目</label>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="计划练习的曲目，用逗号分隔"
                          value={plan.songs}
                          onChange={e => {
                            const next = [...planData];
                            next[idx] = { ...next[idx], songs: e.target.value };
                            setPlanData(next);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setShowPlan(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSavePlan} disabled={planSaving}>
                {planSaving ? '保存中...' : '保存计划'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
