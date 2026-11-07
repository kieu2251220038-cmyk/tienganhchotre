import API from './api';
import type { UserRewardsData } from '../types';

export interface LessonRewardResult {
  starsEarned: number;
  coinsEarned: number;
  totalStars: number;
  totalCoins: number;
  currentStreak: number;
  totalCompleted: number;
  newBadges: string[];
  unlockedAvatars: { name: string; emoji: string }[];
  isFirstTime: boolean;
}

export interface ChestStatus {
  ageGroup: number;
  eligible: boolean;
  claimed: boolean;
  rewardStars: number;
  rewardCoins: number;
  claimedAt: string | null;
}

export interface ChestRewardResult {
  ageGroup: number;
  claimed: boolean;
  alreadyClaimed: boolean;
  rewardStars: number;
  rewardCoins: number;
  totalStars: number;
  totalCoins: number;
  nextAge: number | null;
  levelUpMessage: string;
}

export const progressService = {
  async completeLesson(
    _userId: number,
    lessonId: number,
    score: number = 100,
    _starsEarned: number = 3
  ): Promise<LessonRewardResult | null> {
    try {
      const res = await API.post('/progress/complete', { lessonId, score });
      if (res.data) return res.data as LessonRewardResult;
    } catch (error) {
      throw error;
    }
    return null;
  },

  async markVocabularyLearned(vocabularyId: number): Promise<void> {
    await API.post('/progress/vocabulary/learned', { vocabularyId });
  },

  async getUserRewards(userId: number): Promise<UserRewardsData> {
    try {
      const res = await API.get(`/progress/rewards/${userId}`);
      if (res.data && res.data.user) {
        return res.data;
      }
    } catch (error) {
      throw error;
    }

    throw new Error('Backend không trả về dữ liệu phần thưởng hợp lệ');
  },

  async getLeaderboard(): Promise<any[]> {
    try {
      const res = await API.get('/progress/leaderboard');
      if (Array.isArray(res.data)) {
        return res.data;
      }
    } catch (e) {
      console.error('Lỗi gọi getLeaderboard:', e);
    }
    return [];
  },

  async getChestStatus(ageGroup: number): Promise<ChestStatus> {
    const res = await API.get<ChestStatus>(`/progress/chest/status/${ageGroup}`);
    return res.data;
  },

  async claimChest(ageGroup: number): Promise<ChestRewardResult> {
    const res = await API.post<ChestRewardResult>('/progress/chest/claim', { ageGroup });
    return res.data;
  }
};
