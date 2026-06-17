import { useState, useEffect, useRef } from 'react';
import { practiceAPI } from '../utils/api';
import Timer from '../components/Timer';

interface User {
  id: number;
  username: string;
  instrument: string;
  daily_goal: number;
  role: string;
}

interface PracticePageProps {
  user: User;
  showToast: (type: 'success' | 'error', message: string) => void;
}

const INSTRUMENT_ICONS: Record<string, string> = {
  '钢琴': '🎹',
  '吉他': '🎸',
  '小提琴': '🎻',
  '架子鼓': '🥁',
};

export default function PracticePage({ user, showToast }: PracticePageProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [song, setSong] = useState('');
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [todayTotal, setTodayTotal] = useState(0);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    loadToday();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const loadToday = async () => {
    try {
      const data = await practiceAPI.today();
      setTodayTotal(data.checkin?.total_duration || 0);
      setRecentLogs(data.todayLogs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const startTimer = () => {
    const now = new Date();
    setStartedAt(now);
    setIsRunning(true);
    setShowForm(false);

    timerRef.current = window.setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
    setShowForm(true);
  };

  const resetTimer = () => {
    setElapsed(0);
    setStartedAt(null);
    setShowForm(false);
    setSong('');
    setNotes('');
  };

  const submitPractice = async () => {
    if (!startedAt) return;
    setSubmitting(true);
    try {
      const endedAt = new Date();
      await practiceAPI.end({
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        song,
        notes,
      });
      showToast('success', `打卡成功！本次练习 ${Math.floor(elapsed / 60)} 分钟`);
      resetTimer();
      loadToday();
    } catch (err: any) {
      showToast('error', err.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const goalProgress = Math.min(100, Math.round(((todayTotal + Math.floor(elapsed / 60)) / user.daily_goal) * 100));

  return (
    <div>
      <div className="page-header">
        <h1>{INSTRUMENT_ICONS[user.instrument] || '🎵'} {user.instrument}练习</h1>
        <p>专注练习，享受音乐</p>
      </div>

      {/* Current instrument and goal */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">当前乐器</div>
          <div className="stat-value" style={{ fontSize: 22 }}>
            {INSTRUMENT_ICONS[user.instrument] || '🎵'} {user.instrument}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">今日目标进度</div>
          <div className="stat-value">
            {goalProgress}<span className="stat-unit">%</span>
          </div>
          <div style={{
            marginTop: 8,
            height: 6,
            background: 'var(--border)',
            borderRadius: 3,
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${goalProgress}%`,
              background: goalProgress >= 100 ? 'var(--success)' : 'var(--primary)',
              borderRadius: 3,
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>
      </div>

      {/* Timer */}
      <div className="card" style={{ marginBottom: 24 }}>
        <Timer
          isRunning={isRunning}
          startTime={startedAt}
          onStart={startTimer}
          onStop={stopTimer}
          onReset={resetTimer}
          elapsed={elapsed}
        />

        {/* Practice form after stopping */}
        {showForm && (
          <div className="practice-form">
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 20 }}>
              <h3 style={{ marginBottom: 16, fontSize: 16 }}>记录本次练习</h3>
              <div className="form-group">
                <label className="form-label">练习曲目</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="今天练了什么曲目？"
                  value={song}
                  onChange={e => setSong(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">练习心得</label>
                <textarea
                  className="form-textarea"
                  placeholder="记录你的练习感受..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-success"
                  onClick={submitPractice}
                  disabled={submitting}
                  style={{ flex: 1 }}
                >
                  {submitting ? '提交中...' : `提交打卡 (${Math.floor(elapsed / 60)}分钟)`}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  继续练习
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Today's summary */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">📊 今日练习汇总</div>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', padding: '10px 0' }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>{todayTotal}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>已完成(分钟)</div>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-light)' }}>{user.daily_goal}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>目标(分钟)</div>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: todayTotal >= user.daily_goal ? 'var(--success)' : 'var(--warning)' }}>
              {todayTotal >= user.daily_goal ? '✓' : '⏳'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {todayTotal >= user.daily_goal ? '已达标' : '未达标'}
            </div>
          </div>
        </div>
      </div>

      {/* Recent logs */}
      {recentLogs.length > 0 && (
        <div className="card">
          <div className="card-title">📋 今日练习记录</div>
          {recentLogs.map((log: any, idx: number) => (
            <div key={log.id} style={{
              padding: '12px 0',
              borderBottom: idx < recentLogs.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{log.song || '自由练习'}</span>
                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{log.duration}分钟</span>
              </div>
              {log.notes && (
                <div style={{ color: 'var(--text-light)', fontSize: 13, marginTop: 4 }}>{log.notes}</div>
              )}
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                {new Date(log.started_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                {' - '}
                {new Date(log.ended_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
