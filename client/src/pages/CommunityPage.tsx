import { useState, useEffect } from 'react';
import { communityAPI } from '../utils/api';

interface User {
  id: number;
  username: string;
  instrument: string;
  daily_goal: number;
  role: string;
}

interface CommunityPageProps {
  user: User;
  showToast: (type: 'success' | 'error', message: string) => void;
}

const INSTRUMENTS = ['', '钢琴', '吉他', '小提琴', '架子鼓'];

export default function CommunityPage({ user, showToast }: CommunityPageProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterInstrument, setFilterInstrument] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  const [postDetail, setPostDetail] = useState<any>(null);
  const [commentText, setCommentText] = useState('');

  // Create form state
  const [newType, setNewType] = useState('心得');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newSong, setNewSong] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadPosts();
  }, [filterType, filterInstrument]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterType) params.type = filterType;
      if (filterInstrument) params.instrument = filterInstrument;
      const data = await communityAPI.getPosts(params);
      setPosts(data.posts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTitle || !newContent) {
      showToast('error', '请填写标题和内容');
      return;
    }
    setCreating(true);
    try {
      await communityAPI.createPost({
        type: newType,
        title: newTitle,
        content: newContent,
        song: newSong,
      });
      showToast('success', '发布成功！');
      setShowCreate(false);
      setNewTitle('');
      setNewContent('');
      setNewSong('');
      loadPosts();
    } catch (err: any) {
      showToast('error', err.message || '发布失败');
    } finally {
      setCreating(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const result = await communityAPI.likePost(postId);
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, likes: result.liked ? p.likes + 1 : Math.max(0, p.likes - 1) };
        }
        return p;
      }));
    } catch (err) {
      showToast('error', '操作失败');
    }
  };

  const loadPostDetail = async (postId: number) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
      setPostDetail(null);
      return;
    }
    try {
      const data = await communityAPI.getPost(postId);
      setExpandedPost(postId);
      setPostDetail(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (postId: number) => {
    if (!commentText.trim()) return;
    try {
      await communityAPI.addComment(postId, commentText);
      setCommentText('');
      loadPostDetail(postId);
      showToast('success', '评论成功');
    } catch (err: any) {
      showToast('error', err.message || '评论失败');
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>💬 社区广场</h1>
          <p>分享心得，推荐曲目，互相鼓励</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          ✏️ 发布
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        {['', '心得', '推荐'].map(type => (
          <button
            key={type}
            className={`filter-btn ${filterType === type ? 'active' : ''}`}
            onClick={() => setFilterType(type)}
          >
            {type || '全部'}
          </button>
        ))}
        <span style={{ margin: '0 4px', color: 'var(--border)' }}>|</span>
        {INSTRUMENTS.map(inst => (
          <button
            key={inst}
            className={`filter-btn ${filterInstrument === inst ? 'active' : ''}`}
            onClick={() => setFilterInstrument(inst)}
          >
            {inst || '全部乐器'}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="loading">加载中</div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📝</div>
          <p>暂无帖子，来发布第一条吧！</p>
        </div>
      ) : (
        posts.map(post => (
          <div key={post.id} className="post-card">
            <div className="post-header">
              <div className="post-avatar">
                {post.username.charAt(0).toUpperCase()}
              </div>
              <div className="post-meta">
                <div className="post-author">{post.username}</div>
                <div className="post-time">{formatTime(post.created_at)}</div>
              </div>
              <span className={`post-type-badge ${post.type === '心得' ? 'badge-xinde' : 'badge-tuijian'}`}>
                {post.type}
              </span>
            </div>
            <div className="post-title" onClick={() => loadPostDetail(post.id)} style={{ cursor: 'pointer' }}>
              {post.title}
            </div>
            <div className="post-content">{post.content}</div>
            {post.song && (
              <div style={{ marginBottom: 8, fontSize: 13, color: 'var(--text-light)' }}>
                🎵 相关曲目：{post.song}
              </div>
            )}
            <div className="post-footer">
              <button
                className={`post-action ${post.likes > 0 ? 'liked' : ''}`}
                onClick={() => handleLike(post.id)}
              >
                ❤️ {post.likes}
              </button>
              <button className="post-action" onClick={() => loadPostDetail(post.id)}>
                💬 评论
              </button>
              {post.instrument && (
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
                  {post.instrument}
                </span>
              )}
            </div>

            {/* Comments section */}
            {expandedPost === post.id && postDetail && (
              <div className="comments-section">
                {postDetail.comments?.map((c: any) => (
                  <div key={c.id} className="comment-item">
                    <div className="comment-avatar">{c.username.charAt(0).toUpperCase()}</div>
                    <div className="comment-body">
                      <span className="comment-author">{c.username}</span>
                      <span>{c.content}</span>
                      <div className="comment-time">{formatTime(c.created_at)}</div>
                    </div>
                  </div>
                ))}
                {(!postDetail.comments || postDetail.comments.length === 0) && (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>暂无评论</div>
                )}
                <div className="comment-form">
                  <input
                    type="text"
                    placeholder="写评论..."
                    value={expandedPost === post.id ? commentText : ''}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleComment(post.id); }}
                  />
                  <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => handleComment(post.id)}>
                    发送
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}

      {/* Create post modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="modal">
            <div className="modal-title">发布新帖</div>
            <div className="form-group">
              <label className="form-label">类型</label>
              <select className="form-select" value={newType} onChange={e => setNewType(e.target.value)}>
                <option value="心得">心得分享</option>
                <option value="推荐">曲目推荐</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">标题</label>
              <input
                className="form-input"
                placeholder="输入标题"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">内容</label>
              <textarea
                className="form-textarea"
                placeholder="分享你的练习心得或推荐曲目..."
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                rows={5}
              />
            </div>
            <div className="form-group">
              <label className="form-label">相关曲目（可选）</label>
              <input
                className="form-input"
                placeholder="曲目名称"
                value={newSong}
                onChange={e => setNewSong(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                {creating ? '发布中...' : '发布'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
