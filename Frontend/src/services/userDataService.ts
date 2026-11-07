import API from './api';

export interface UserPreferences {
  user_id: number;
  onboarding_completed: boolean;
  unlocked_age: number;
  avatar: string;
  sticker: string;
}

export interface UserPreferenceUpdate {
  onboarding_completed?: boolean;
  unlocked_age?: number;
  avatar?: string;
  sticker?: string;
}

export interface PronunciationAttempt {
  index: number;
  word: string;
  recognized: string;
  score: number;
  correct: boolean;
}

export interface SpeakingSummary {
  userId: number;
  lessonId: number;
  topicId: number;
  completedAt: string;
  totalWords: number;
  averageScore: number;
  correctCount: number;
  incorrectCount: number;
  attempts: PronunciationAttempt[];
}

export const userDataService = {
  async getPreferences(): Promise<UserPreferences> {
    const response = await API.get<UserPreferences>('/user-data/preferences');
    return response.data;
  },

  async updatePreferences(payload: UserPreferenceUpdate): Promise<UserPreferences> {
    const response = await API.put<UserPreferences>('/user-data/preferences', payload);
    return response.data;
  },

  async saveSpeakingSummary(summary: SpeakingSummary): Promise<void> {
    await API.post('/user-data/speaking-summaries', {
      lessonId: summary.lessonId,
      topicId: summary.topicId,
      completedAt: summary.completedAt,
      totalWords: summary.totalWords,
      averageScore: summary.averageScore,
      correctCount: summary.correctCount,
      incorrectCount: summary.incorrectCount,
      attempts: summary.attempts
    });
  },

  async getLatestSpeakingSummary(userId?: number): Promise<SpeakingSummary | null> {
    const response = await API.get<SpeakingSummary | null>('/user-data/speaking-summaries/latest', {
      params: userId ? { userId } : undefined
    });
    return response.data;
  },

  // Chuyển dữ liệu cũ trong localStorage lên Backend một lần, sau đó xóa bản local.
  async migrateLegacyLocalData(userId: number): Promise<void> {
    const payload: UserPreferenceUpdate = {};
    const legacyOnboarding = localStorage.getItem('kids_onboarding_completed');
    const legacyUnlockedAge = localStorage.getItem(`kids_unlocked_age_${userId}`);
    const legacyAvatar = localStorage.getItem(`user_avatar_${userId}`);
    const legacySticker = localStorage.getItem(`user_sticker_${userId}`);
    const legacySummary = localStorage.getItem(`kids-speaking-summary-${userId}`);

    if (legacyOnboarding === 'true') payload.onboarding_completed = true;
    if (legacyUnlockedAge) {
      const age = Number(legacyUnlockedAge);
      if (Number.isInteger(age) && age >= 3 && age <= 8) payload.unlocked_age = age;
    }
    if (legacyAvatar) payload.avatar = legacyAvatar;
    if (legacySticker) payload.sticker = legacySticker;

    if (Object.keys(payload).length > 0) await this.updatePreferences(payload);
    if (legacySummary) {
      try {
        const parsed = JSON.parse(legacySummary) as SpeakingSummary;
        if (parsed.userId === userId && Array.isArray(parsed.attempts)) await this.saveSpeakingSummary(parsed);
      } catch {
        // Dữ liệu cũ hỏng sẽ được bỏ qua, không làm gián đoạn đăng nhập.
      }
    }

    localStorage.removeItem('kids_onboarding_completed');
    localStorage.removeItem(`kids_unlocked_age_${userId}`);
    localStorage.removeItem(`user_avatar_${userId}`);
    localStorage.removeItem(`user_sticker_${userId}`);
    localStorage.removeItem(`kids-speaking-summary-${userId}`);
  }
};
