import { courseService } from './courseService';
import { authService } from './authService';
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
    const lessonAge = normalizeAge(lesson.target_age || lesson.age_group, 0);

    // Tài khoản 8 tuổi được mở toàn bộ hoạt động của mọi bậc.
    // Các tài khoản nhỏ hơn chỉ được học trước FLASHCARD/VIDEO;
    // Nói, Quiz và Game chỉ mở trong bậc không cao hơn tuổi tài khoản.
    if (accountAge >= 8 || (lessonAge > 0 && lessonAge <= accountAge)) {
      return {
        allowed: true,
        lesson
      };
    }

    const modeLabel = mode === 'SPEAKING' ? 'Nói' : mode === 'QUIZ' ? 'Quiz' : 'Game';
    return {
      allowed: false,
      lesson,
      message: `Phần ${modeLabel} của Bậc ${lessonAge || '?'} tuổi chưa mở. Tài khoản ${accountAge} tuổi chỉ được học trước bài học kiến thức; hoạt động này không được học vượt.`
    };
  }
};

