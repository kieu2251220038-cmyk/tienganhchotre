import API from './api';

export function getAdminErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: unknown } } }).response?.data?.message;
  return typeof message === 'string' && message.trim() ? `❌ ${message}` : `❌ ${fallback}`;
}

export interface AdminStats {
  total_users: number;
  total_lessons: number;
  total_vocabularies: number;
  total_completions: number;
  recent_lessons: Array<{ id: number; title: string; lesson_type: string; status: string; difficulty: number; topic_name: string }>;
}

export interface AdminCourse {
  id: number;
  title: string;
  description: string;
  age_group: string;
  status: 'DRAFT' | 'PUBLISHED';
  topic_count: number;
  lesson_count: number;
}

export interface AdminUser {
  id: number;
  username: string;
  display_name: string;
  role: 'USER' | 'ADMIN' | 'EXPERT' | 'PARENT';
  age_group: string;
  created_at: string;
}

export interface AdminLesson {
  id: number;
  topic_id: number;
  title: string;
  lesson_type: 'VIDEO' | 'FLASHCARD' | 'SPEAKING' | 'QUIZ' | 'GAME';
  difficulty: number;
  sort_order: number;
  status: 'DRAFT' | 'PUBLISHED';
  approval_status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewer_name?: string | null;
  reviewed_at?: string | null;
  topic_name?: string;
  topic_sort_order?: number;
  course_title?: string;
  age_group?: string;
}

export interface AdminTopic {
  id: number;
  course_id: number;
  name: string;
  description: string;
  sort_order: number;
  status: 'DRAFT' | 'PUBLISHED';
  course_title?: string;
  age_group?: string;
  lesson_count?: number;
  vocab_count?: number;
}

export interface AdminVocabulary {
  id: number;
  topic_id: number;
  word: string;
  meaning_vi: string;
  phonetic: string;
  image_url?: string;
  image_data?: string;
  image_name?: string;
  topic_name?: string;
}

export interface AdminQuizQuestion {
  id: number;
  lesson_id: number;
  question_type: string;
  question_text: string;
  points: number;
  lesson_title?: string;
  answers?: Array<{ id: number; answer_text: string; is_correct: boolean | number; media_url?: string }>;
}

export const adminService = {
  async getStats(): Promise<AdminStats> {
    const res = await API.get<AdminStats>('/admin/stats');
    return res.data;
  },

  async getCourses(): Promise<AdminCourse[]> {
    const res = await API.get<AdminCourse[]>('/admin/courses');
    return res.data;
  },

  async createCourse(data: { title: string; description: string; age_group: string; status: 'DRAFT' | 'PUBLISHED' }): Promise<{ id: number }> {
    const res = await API.post<{ id: number }>('/admin/courses', data);
    return res.data;
  },

  async updateCourse(id: number, data: { title: string; description: string; age_group: string; status: 'DRAFT' | 'PUBLISHED' }): Promise<void> {
    await API.put(`/admin/courses/${id}`, data);
  },

  async deleteCourse(id: number): Promise<void> {
    await API.delete(`/admin/courses/${id}`);
  },

  async getUsers(): Promise<AdminUser[]> {
    const res = await API.get<AdminUser[]>('/admin/users');
    return res.data;
  },

  async updateUser(id: number, data: Partial<AdminUser>): Promise<void> {
    await API.put(`/admin/users/${id}`, data);
  },

  async deleteUser(id: number): Promise<void> {
    await API.delete(`/admin/users/${id}`);
  },

  async getLessons(): Promise<AdminLesson[]> {
    const res = await API.get<AdminLesson[]>('/admin/lessons');
    return res.data;
  },

  async createLesson(data: Partial<AdminLesson>): Promise<void> {
    await API.post('/admin/lessons', data);
  },

  async updateLesson(id: number, data: Partial<AdminLesson>): Promise<void> {
    await API.put(`/admin/lessons/${id}`, data);
  },

  async deleteLesson(id: number): Promise<void> {
    await API.delete(`/admin/lessons/${id}`);
  },

  async getVocabularies(): Promise<AdminVocabulary[]> {
    const res = await API.get<AdminVocabulary[]>('/admin/vocabularies');
    return res.data;
  },

  async createVocabulary(data: { topic_id: number; word: string; meaning_vi: string; phonetic: string; image_url?: string; image_data?: string; image_name?: string }): Promise<void> {
    await API.post('/admin/vocabularies', data);
  },

  async updateVocabulary(id: number, data: Partial<AdminVocabulary>): Promise<void> {
    await API.put(`/admin/vocabularies/${id}`, data);
  },

  async deleteVocabulary(id: number): Promise<void> {
    await API.delete(`/admin/vocabularies/${id}`);
  },

  async getQuestions(): Promise<AdminQuizQuestion[]> {
    const res = await API.get<AdminQuizQuestion[]>('/admin/questions');
    return res.data;
  },

  async createQuestion(data: { lesson_id: number; question_text: string; question_type?: string; points?: number; answers: Array<{ answer_text: string; is_correct: boolean }> }): Promise<void> {
    await API.post('/admin/questions', data);
  },

  async updateQuestion(id: number, data: { lesson_id: number; question_text: string; question_type?: string; points?: number; answers: Array<{ answer_text: string; is_correct: boolean }> }): Promise<void> {
    await API.put(`/admin/questions/${id}`, data);
  },

  async deleteQuestion(id: number): Promise<void> {
    await API.delete(`/admin/questions/${id}`);
  },

  async getTopics(): Promise<AdminTopic[]> {
    const res = await API.get<AdminTopic[]>('/admin/topics');
    return res.data;
  },

  async createTopic(data: { course_id?: number; name: string; description?: string; sort_order?: number; status?: string }): Promise<{ id: number }> {
    const res = await API.post<{ id: number }>('/admin/topics', data);
    return res.data;
  },

  async updateTopic(id: number, data: Partial<AdminTopic>): Promise<void> {
    await API.put(`/admin/topics/${id}`, data);
  },

  async deleteTopic(id: number): Promise<void> {
    await API.delete(`/admin/topics/${id}`);
  },

  async getAnalytics(): Promise<any> {
    const res = await API.get('/admin/analytics');
    return res.data;
  }
};
