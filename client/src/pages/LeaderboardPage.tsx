import { useState, useEffect } from 'react';
import { leaderboardAPI } from '../utils/api';

const INSTRUMENT_ICONS: Record<string, string> = {
  '钢琴': '🎹',
  '吉他': '🎸',
  '小提琴': '🎻',
  '架子鼓': '🥁',
};

const INSTRUMENT_CLASSES: Record<string, string> = {
  '钢琴': 'tag-piano',
  '吉他': 'tag-guitar',
  '小提琴': 'tag-violin',
  '架子鼓': 'tag-drums',
};

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [month, setMonth] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const data = await leaderboardAPI.monthly();
      setLeaderboard(data.leaderboard);
      setMyRank(data.myRank);
      setMonth(data.month);
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
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  };

  if (loading) return <div className="loading">加载中</div>;

  return (
    <div>
      <div className="page-header">
        <h1>🏆 月度排行榜</h1>
        <p>{month} 练习时长排名</p>
      </div>

      {myRank && (
        <div style={{
          background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
          borderRadius: 'var(--radius)',
          padding: '16px 24px',
          color: 'white',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>我的排名</span>
          <span style={{ fontSize: 24, fontWeight: 700 }}>第 {myRank} 名</span>
        </div>
      )}

      <div className="card">
        {leaderboard.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🏆</div>
            <p>暂无排行数据</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>排名</th>
                  <th>用户</th>
                  <th>乐器</th>
                  <th>本月时长</th>
                  <th>练习次数</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((item) => (
                  <tr key={item.id} className={item.rank === myRank ? 'me' : ''}>
                    <td>
                      <span className={`rank-badge ${item.rank <= 3 ? `rank-${item.rank}` : 'rank-other'}`}>
                        {item.rank}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {item.username}
                      {item.rank === myRank && <span style={{ marginLeft: 6, fontSize: 12, color: 'var(--primary)' }}>(我)</span>}
                    </td>
                    <td>
                      <span className={`instrument-tag ${INSTRUMENT_CLASSES[item.instrument] || ''}`}>
                        {INSTRUMENT_ICONS[item.instrument] || '🎵'} {item.instrument}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      {formatDuration(item.total_duration)}
                    </td>
                    <td>{item.session_count}次</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
