import API from './api';
import type { Lesson, ExpertStats, CurriculumStandard, ApprovalStatus } from '../types';

export interface ReviewLessonPayload {
  approval_status: ApprovalStatus;
  review_notes?: string;
}

export const expertService = {
  // Lấy danh sách bài học cần duyệt / lịch sử duyệt
  getLessonsForReview: async (params?: { status?: string; age?: string; type?: string }): Promise<Lesson[]> => {
    const res = await API.get<Lesson[]>('/expert/lessons', { params });
    return res.data;
  },

  // Chuyên gia duyệt hoặc gửi phản hồi bài học
  reviewLesson: async (lessonId: number, payload: ReviewLessonPayload): Promise<{ message: string; lesson: Lesson }> => {
    const res = await API.put<{ message: string; lesson: Lesson }>(`/expert/lessons/${lessonId}/review`, payload);
    return res.data;
  },

  // Lấy số liệu thống kê kiểm duyệt
  getStats: async (): Promise<ExpertStats> => {
    const res = await API.get<ExpertStats>('/expert/stats');
    return res.data;
  },

  // Lấy bộ khung tiêu chuẩn sư phạm 3-8 tuổi
  getStandards: async (): Promise<CurriculumStandard[]> => {
    const res = await API.get<CurriculumStandard[]>('/expert/standards');
    return res.data;
  }
};
