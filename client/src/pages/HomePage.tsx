import { useState, useEffect } from 'react';
import { practiceAPI } from '../utils/api';

interface User {
  id: number;
  username: string;
  instrument: string;
  daily_goal: number;
  role: string;
}

type Page = 'login' | 'register' | 'home' | 'practice' | 'leaderboard' | 'community' | 'profile' | 'admin';

interface HomePageProps {
  user: User;
  navigate: (page: Page) => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

interface WeekDay {
  date: string;
  day: string;
  total_duration: number;
  goal_met: number;
  isToday: boolean;
  isFuture: boolean;
  planDuration: number;
  planSongs: string;
}

interface TodayData {
  checkin: any;
  daily_goal: number;
  todayLogs: any[];
  todayPlan: { duration: number; songs: string } | null;
}

export default function HomePage({ user, navigate, showToast }: HomePageProps) {
  const [weekData, setWeekData] = useState<WeekDay[]>([]);
  const [streak, setStreak] = useState(0);
  const [todayData, setTodayData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [weekRes, todayRes] = await Promise.all([
        practiceAPI.week(),
        practiceAPI.today()
      ]);
      setWeekData(weekRes.weekData);
      setStreak(weekRes.streak);
      setTodayData(todayRes);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const todayDuration = todayData?.checkin?.total_duration || 0;
  const goalProgress = Math.min(100, Math.round((todayDuration / user.daily_goal) * 100));

  if (loading) {
    return <div className="loading">加载中</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>欢迎回来，{user.username}！</h1>
        <p>今天也要坚持练习哦</p>
      </div>

      {/* Streak display */}
      {streak > 0 && (
        <div className="streak-display">
          <div className="streak-fire">🔥</div>
          <div className="streak-info">
            <div className="streak-count">{streak}</div>
            <div className="streak-label">连续完成目标天数</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 14, opacity: 0.9 }}>
            继续保持！
          </div>
        </div>
      )}

      {/* Today's progress */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">今日练习时长</div>
          <div className="stat-value">
            {todayDuration} <span className="stat-unit">分钟</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">今日目标</div>
          <div className="stat-value">
            {user.daily_goal} <span className="stat-unit">分钟</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">目标完成度</div>
          <div className="stat-value" style={{ color: goalProgress >= 100 ? 'var(--success)' : 'var(--primary)' }}>
            {goalProgress} <span className="stat-unit">%</span>
          </div>
        </div>
      </div>

      {/* Quick action */}
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <button
          className="btn btn-success btn-lg"
          onClick={() => navigate('practice')}
          style={{ padding: '16px 48px', fontSize: 18, borderRadius: 16 }}
        >
          🎵 开始练习
        </button>
      </div>

      {/* Today's Plan */}
      {todayData?.todayPlan && (todayData.todayPlan.duration > 0 || todayData.todayPlan.songs) && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">📋 今日练习计划</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            {todayData.todayPlan.duration > 0 && (
              <div className="today-plan-item">
                <div className="today-plan-label">计划时长</div>
                <div className="today-plan-value" style={{ color: 'var(--primary)' }}>
                  {todayData.todayPlan.duration} <span className="today-plan-unit">分钟</span>
                </div>
              </div>
            )}
            {todayData.todayPlan.songs && (
              <div className="today-plan-item" style={{ flex: 2 }}>
                <div className="today-plan-label">计划曲目</div>
                <div className="today-plan-songs">
                  {todayData.todayPlan.songs.split(/[,，、]/).filter(Boolean).map((s, i) => (
                    <span key={i} className="today-plan-song-tag">{s.trim()}</span>
                  ))}
                </div>
              </div>
            )}
            {todayData.todayPlan.duration > 0 && (
              <div className="today-plan-item">
                <div className="today-plan-label">计划进度</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    flex: 1,
                    height: 8,
                    background: 'var(--border)',
                    borderRadius: 4,
                    overflow: 'hidden',
                    minWidth: 80
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, Math.round((todayDuration / todayData.todayPlan.duration) * 100))}%`,
                      background: todayDuration >= todayData.todayPlan.duration ? 'var(--success)' : 'var(--primary)',
                      borderRadius: 4,
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                  <span style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: todayDuration >= todayData.todayPlan.duration ? 'var(--success)' : 'var(--primary)'
                  }}>
                    {Math.min(100, Math.round((todayDuration / todayData.todayPlan.duration) * 100))}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Today's practice logs */}
      {todayData?.todayLogs && todayData.todayLogs.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">📋 今日练习记录</div>
          {todayData.todayLogs.map((log: any, idx: number) => (
            <div key={log.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 0',
              borderBottom: idx < todayData.todayLogs.length - 1 ? '1px solid var(--border)' : 'none'
            }}>
              <div>
                <span style={{ fontWeight: 600 }}>{log.song || '自由练习'}</span>
                {log.notes && <span style={{ color: 'var(--text-light)', marginLeft: 12, fontSize: 13 }}>{log.notes}</span>}
              </div>
              <div style={{ color: 'var(--primary)', fontWeight: 600 }}>{log.duration}分钟</div>
            </div>
          ))}
        </div>
      )}

      {/* Weekly calendar */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">📅 本周练习日历</div>
        <div className="week-calendar">
          {weekData.map((day) => {
            let cellClass = 'day-cell';
            if (day.isToday) cellClass += ' today';
            if (day.isFuture) cellClass += ' future';
            else if (day.total_duration > 0 && day.goal_met) cellClass += ' goal-met';
            else if (day.total_duration > 0 && !day.goal_met) cellClass += ' goal-not-met';
            if (day.planDuration > 0 || day.planSongs) cellClass += ' has-plan';

            return (
              <div key={day.date} className={cellClass}>
                <div className="day-name">{day.day}</div>
                <div className="day-date">{day.date.split('-').slice(1).join('/')}</div>
                {(day.planDuration > 0 || day.planSongs) && (
                  <div className="day-plan-indicator" title={day.planSongs ? `计划: ${day.planDuration}分钟 - ${day.planSongs}` : `计划: ${day.planDuration}分钟`}>
                    📋
                  </div>
                )}
                <div className="day-duration" style={{
                  color: day.total_duration > 0
                    ? day.goal_met ? 'var(--success)' : 'var(--danger)'
                    : 'var(--text-muted)'
                }}>
                  {day.total_duration}
                </div>
                <div className="day-unit">分钟</div>
                {day.planDuration > 0 && (
                  <div className="day-plan-duration">目标{day.planDuration}分</div>
                )}
                {!day.isFuture && (
                  <div className="day-status">
                    {day.total_duration === 0
                      ? '未练习'
                      : day.goal_met
                        ? '✅ 达标'
                        : '⏳ 未达标'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 20, fontSize: 13, color: 'var(--text-light)' }}>
        <span>
          <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: 'var(--success)', marginRight: 6 }}></span>
          完成目标
        </span>
        <span>
          <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: 'var(--danger)', marginRight: 6 }}></span>
          未完成目标
        </span>
        <span>
          <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: 'var(--text-muted)', marginRight: 6 }}></span>
          未练习
        </span>
      </div>
    </div>
  );
}
