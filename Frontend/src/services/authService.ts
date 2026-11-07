import API from './api';
import type { User } from '../types';

const STORAGE_KEY = 'kids_user';
const TOKEN_KEY = 'kids_token';

export const authService = {
  getCurrentUser(): User {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // ignore
      }
    }
    // Default logged in user for kids
    return {
      id: 6,
      username: 'nga',
      display_name: 'Bé Nga 👧',
      role: 'USER',
      age_group: '5'
    };
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setCurrentUser(user: User, token?: string) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  async login(username: string, password: string): Promise<User> {
    try {
      const res = await API.post('/auth/login', { username, password });
      if (res.data && res.data.user) {
        this.setCurrentUser(res.data.user, res.data.token);
        return res.data.user;
      }
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      throw new Error(errorMsg || 'Đăng nhập không thành công');
    }
    throw new Error('API đăng nhập không trả về thông tin người dùng hợp lệ');
  },

  async getProfile(): Promise<User> {
    const res = await API.get<{ user: User }>('/auth/me');
    if (!res.data?.user) throw new Error('Không lấy được hồ sơ người dùng từ backend');
    this.setCurrentUser(res.data.user);
    return res.data.user;
  },

  async register(username: string, password: string, displayName: string, ageGroup: string = '5', dailyGoalMinutes: number = 10): Promise<User> {
    try {
      const res = await API.post('/auth/register', { username, password, displayName, ageGroup, dailyGoalMinutes });
      if (res.data && res.data.token && res.data.user) {
        this.setCurrentUser(res.data.user, res.data.token);
        return res.data.user;
      }
      throw new Error('Dữ liệu trả về không hợp lệ');
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      throw new Error(errorMsg || 'Đăng ký không thành công');
    }
  },

  async switchDemoUser(userId: number): Promise<{ user: User; token: string }> {
    try {
      const res = await API.get(`/auth/demo-token/${userId}`);
      if (res.data && res.data.token && res.data.user) {
        this.setCurrentUser(res.data.user, res.data.token);
        return { user: res.data.user, token: res.data.token };
      }
      throw new Error('Dữ liệu demo không hợp lệ');
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      throw new Error(errorMsg || 'Không thể chuyển đổi người dùng demo');
    }
  },

  async ensureAuthenticated(): Promise<string> {
    let token = this.getToken();
    if (!token) {
      const user = this.getCurrentUser();
      const res = await API.get(`/auth/demo-token/${user.id}`);
      token = res.data.token;
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      }
    }
    return token || '';
  },

  logout() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }
};
