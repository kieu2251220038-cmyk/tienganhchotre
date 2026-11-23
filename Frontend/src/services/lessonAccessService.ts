import { courseService } from './courseService';
import { authService } from './authService';
import { userDataService } from './userDataService';
import { progressService } from './progressService';
import type { Lesson } from '../types';

export type RestrictedLessonMode = 'SPEAKING' | 'QUIZ' | 'GAME';

export interface LessonAccessResult {
  allowed: boolean;
  lesson: Lesson | null;
  message?: string;
}

function normalizeAge(value: string | number | undefined, fallback = 3) {
  const age = Number(value);
  return Number.isInteger(age) && age >= 3 && age <= 8 ? age : fallback;
}

const STUDY_TYPES = new Set<Lesson['lesson_type']>(['FLASHCARD']);

export const lessonAccessService = {
  async checkRestrictedLesson(lessonId: number, mode: RestrictedLessonMode): Promise<LessonAccessResult> {
    const details = await courseService.getLessonDetail(lessonId);
    const lesson = details.lesson;

    if (!lesson || lesson.lesson_type !== mode) {
      return {
        allowed: false,
        lesson: lesson || null,
        message: 'Bài học này không đúng loại hoạt động trong lộ trình.'
      };
    }

    const user = authService.getCurrentUser();
    const accountAge = normalizeAge(user.age_group);
    const preferences = await userDataService.getPreferences().catch(() => null);
    const unlockedAge = normalizeAge(preferences?.unlocked_age, accountAge);
    const maxInteractiveAge = Math.max(accountAge, unlockedAge);
    const lessonAge = normalizeAge(lesson.target_age || lesson.age_group, 0);

    // Tài khoản đã mở đến bậc nào thì được dùng toàn bộ hoạt động trong các bậc đó.
    // Các bậc cao hơn chỉ được học trước FLASHCARD/VIDEO.
    if (maxInteractiveAge >= 8 || (lessonAge > 0 && lessonAge <= maxInteractiveAge)) {
      return {
        allowed: true,
        lesson
      };
    }

    // Bé có thể học trước phần kiến thức của bậc cao hơn. Khi phần được mở
    // của một chặng đã hoàn thành, cho phép học lại toàn bộ chặng, kể cả
    // Nói AI, Quiz và Game.
    const [topicLessons, rewards] = await Promise.all([
      courseService.getLessonsByTopic(lesson.topic_id).catch(() => [] as Lesson[]),
      progressService.getUserRewards(user.id).catch(() => null)
    ]);
    const completedIds = new Set((rewards?.completed_lessons || []).map((item) => Number(item.lesson_id)));
    const isComplete = (candidate: Lesson) => completedIds.has(candidate.id) || Boolean(candidate.is_completed);
    const replayableLessons = topicLessons.filter((candidate) => {
      if (STUDY_TYPES.has(candidate.lesson_type)) return true;
      const candidateAge = normalizeAge(candidate.target_age || candidate.age_group, 0);
      return maxInteractiveAge >= 8 || (candidateAge > 0 && candidateAge <= maxInteractiveAge);
    });
    const stageCompleted = replayableLessons.length > 0 && replayableLessons.every(isComplete);

    if (isComplete(lesson) || stageCompleted) {
      return {
        allowed: true,
        lesson
      };
    }

    const modeLabel = mode === 'SPEAKING' ? 'Nói' : mode === 'QUIZ' ? 'Quiz' : 'Game';
    return {
      allowed: false,
      lesson,
      message: `Phần ${modeLabel} của Bậc ${lessonAge || '?'} tuổi chưa mở. Tài khoản ${accountAge} tuổi chỉ được học trước bài học kiến thức; hoạt động tương tác chỉ mở đến Bậc ${maxInteractiveAge} tuổi.`
    };
  }
};

