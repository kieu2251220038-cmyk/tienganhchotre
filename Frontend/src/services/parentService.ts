import API from './api';
import type { ParentChild, ChildOverview, ChildActivity, ChildSkill, ChildVocabularyProgress } from '../types';

export const parentService = {
  // Lấy danh sách con em của phụ huynh
  getChildren: async (parentId?: number): Promise<ParentChild[]> => {
    const url = parentId ? `/parent/${parentId}/children` : '/parent/children';
    const res = await API.get<ParentChild[]>(url);
    return res.data;
  },

  // Liên kết thêm tài khoản con bằng xác minh an toàn
  linkChild: async (data: { username: string; password?: string; relationship?: string; usernameOrId?: string }): Promise<{ message: string; child: ParentChild }> => {
    const res = await API.post<{ message: string; child: ParentChild }>('/parent/children/link', data);
    return res.data;
  },

  // Tạo mới hồ sơ bé trực tiếp từ phụ huynh
  createChild: async (data: {
    displayName: string;
    username: string;
    password: string;
    ageGroup?: string;
    relationship?: string;
  }): Promise<{ message: string; child: ParentChild }> => {
    const res = await API.post<{ message: string; child: ParentChild }>('/parent/children/create', data);
    return res.data;
  },

  // Lấy tổng quan tiến độ của con
  getChildOverview: async (childId: number): Promise<ChildOverview> => {
    const res = await API.get<ChildOverview>(`/parent/child/${childId}/overview`);
    return res.data;
  },

  // Lịch sử học tập gần đây của con
  getChildActivities: async (childId: number): Promise<ChildActivity[]> => {
    const res = await API.get<ChildActivity[]>(`/parent/child/${childId}/activity-log`);
    return res.data;
  },

  getChildVocabularyProgress: async (childId: number): Promise<ChildVocabularyProgress> => {
    const res = await API.get<ChildVocabularyProgress>(`/parent/child/${childId}/vocabulary-progress`);
    return res.data;
  },

  // Cập nhật mục tiêu học tập hàng ngày
  updateStudyGoals: async (childId: number, dailyGoalMinutes: number, ageGroup?: string): Promise<{ message: string }> => {
    const res = await API.put<{ message: string }>(`/parent/child/${childId}/goals`, {
      daily_goal_minutes: dailyGoalMinutes,
      age_group: ageGroup
    });
    return res.data;
  },

  // Đánh giá 4 kỹ năng của con
  getChildSkills: async (childId: number): Promise<{ childId: string; skills: ChildSkill[]; recommendations: string[] }> => {
    const res = await API.get<{ childId: string; skills: ChildSkill[]; recommendations: string[] }>(`/parent/child/${childId}/skills`);
    return res.data;
  }
};
