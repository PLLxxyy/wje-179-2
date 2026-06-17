const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setToken(token: string) {
  localStorage.setItem('token', token);
}

export function removeToken() {
  localStorage.removeItem('token');
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

async function request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;
  const token = getToken();

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '请求失败');
  }

  return data;
}

// Auth API
export const authAPI = {
  login: (username: string, password: string) =>
    request('/auth/login', { method: 'POST', body: { username, password } }),
  register: (data: { username: string; password: string; instrument: string; daily_goal: number }) =>
    request('/auth/register', { method: 'POST', body: data }),
  getMe: () => request('/auth/me'),
  updateProfile: (data: { instrument?: string; daily_goal?: number; bio?: string }) =>
    request('/auth/profile', { method: 'PUT', body: data }),
};

// Practice API
export const practiceAPI = {
  start: () => request('/practice/start', { method: 'POST' }),
  end: (data: { startedAt: string; endedAt: string; song?: string; notes?: string }) =>
    request('/practice/end', { method: 'POST', body: data }),
  today: () => request('/practice/today'),
  week: () => request('/practice/week'),
  history: (page = 1, limit = 20) => request(`/practice/history?page=${page}&limit=${limit}`),
  stats: (period = 'week') => request(`/practice/stats?period=${period}`),
};

// Community API
export const communityAPI = {
  getPosts: (params?: { page?: number; type?: string; instrument?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.type) query.set('type', params.type);
    if (params?.instrument) query.set('instrument', params.instrument);
    return request(`/community/posts?${query.toString()}`);
  },
  getPost: (id: number) => request(`/community/posts/${id}`),
  createPost: (data: { type?: string; title: string; content: string; instrument?: string; song?: string }) =>
    request('/community/posts', { method: 'POST', body: data }),
  likePost: (id: number) => request(`/community/posts/${id}/like`, { method: 'POST' }),
  addComment: (postId: number, content: string) =>
    request(`/community/posts/${postId}/comments`, { method: 'POST', body: { content } }),
};

// Leaderboard API
export const leaderboardAPI = {
  monthly: () => request('/leaderboard/monthly'),
};

// Admin API
export const adminAPI = {
  stats: () => request('/admin/stats'),
  users: () => request('/admin/users'),
};
