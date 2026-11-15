import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, STORAGE_KEYS } from './config';
import type { CurriculumStage, LessonDetailResponse, MiniGame, MobileUser, RewardsData, RewardResult, Vocabulary } from './types';

interface LoginResponse {
  token: string;
  user: MobileUser;
}

interface RegisterResponse {
  message?: string;
  token?: string;
  user?: MobileUser;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.token);
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || `API lỗi (${response.status})`);
  return data as T;
}

export const mobileApi = {
  async register(username: string, password: string, displayName: string, ageGroup: string): Promise<RegisterResponse> {
    return request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
        displayName,
        ageGroup,
        role: 'USER',
        dailyGoalMinutes: 10
      })
    });
  },

  async login(username: string, password: string): Promise<LoginResponse> {
    const result = await request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.token, result.token],
      [STORAGE_KEYS.user, JSON.stringify(result.user)]
    ]);
    return result;
  },

  async restoreSession(): Promise<MobileUser | null> {
    const rawUser = await AsyncStorage.getItem(STORAGE_KEYS.user);
    const token = await AsyncStorage.getItem(STORAGE_KEYS.token);
    if (!rawUser || !token) return null;
    try {
      return JSON.parse(rawUser) as MobileUser;
    } catch {
      await this.logout();
      return null;
    }
  },

  async logout(): Promise<void> {
    await AsyncStorage.multiRemove([STORAGE_KEYS.token, STORAGE_KEYS.user]);
  },

  getRoadmap(age?: string | number): Promise<CurriculumStage[]> {
    const query = age ? `?ages=${encodeURIComponent(String(age))}` : '';
    return request<CurriculumStage[]>(`/curriculum/roadmap${query}`);
  },

  getLessonDetail(lessonId: number): Promise<LessonDetailResponse> {
    return request<LessonDetailResponse>(`/content/lessons/${lessonId}`);
  },

  getVocabularies(topicId: number): Promise<Vocabulary[]> {
    return request<Vocabulary[]>(`/content/topics/${topicId}/vocabularies`);
  },

  markVocabularyLearned(vocabularyId: number): Promise<void> {
    return request<void>('/progress/vocabulary/learned', {
      method: 'POST',
      body: JSON.stringify({ vocabularyId })
    });
  },

  completeLesson(lessonId: number, score = 100): Promise<RewardResult> {
    return request<RewardResult>('/progress/complete', {
      method: 'POST',
      body: JSON.stringify({ lessonId, score })
    });
  },

  getRewards(userId: number): Promise<RewardsData> {
    return request<RewardsData>(`/progress/rewards/${userId}`);
  },

  getChestStatus(ageGroup: number): Promise<{ eligible: boolean; claimed: boolean; rewardStars: number; rewardCoins: number }> {
    return request(`/progress/chest/status/${ageGroup}`);
  },

  claimChest(ageGroup: number): Promise<{ rewardStars: number; rewardCoins: number; totalStars: number; totalCoins: number; levelUpMessage: string }> {
    return request('/progress/chest/claim', { method: 'POST', body: JSON.stringify({ ageGroup }) });
  },

  getPreferences(): Promise<{ user_id: number; onboarding_completed: boolean; unlocked_age: number; avatar: string; sticker: string }> {
    return request('/user-data/preferences');
  },

  getMiniGames(topicId?: number, gameId?: number): Promise<MiniGame[]> {
    const query = new URLSearchParams();
    if (topicId) query.set('topicId', String(topicId));
    if (gameId) query.set('gameId', String(gameId));
    return request<MiniGame[]>(`/games${query.toString() ? `?${query.toString()}` : ''}`);
  },

  async transcribeAudio(uri: string, targetText: string): Promise<{ text: string; confidence: number | null; phonemeScore?: number | null; provider?: string }> {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.token);
    const formData = new FormData();
    formData.append('audio', { uri, name: 'speech.m4a', type: 'audio/mp4' } as any);
    formData.append('targetText', targetText);
    const response = await fetch(`${API_BASE_URL}/voice/transcribe`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || `API lỗi (${response.status})`);
    return data;
  },

  saveSpeakingSummary(summary: {
    lessonId: number;
    topicId: number;
    completedAt: string;
    totalWords: number;
    averageScore: number;
    correctCount: number;
    incorrectCount: number;
    attempts: Array<{ index: number; word: string; recognized: string; score: number; correct: boolean }>;
  }): Promise<void> {
    return request<void>('/user-data/speaking-summaries', {
      method: 'POST',
      body: JSON.stringify(summary)
    });
  }
};
