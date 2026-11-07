import API from './api';
import type { CurriculumStage, Lesson, Vocabulary } from '../types';

export interface SearchMaterialsParams {
  age?: string;
  type?: string;
  keyword?: string;
  approval?: string;
}

export interface SearchMaterialsResponse {
  total: number;
  filters: SearchMaterialsParams;
  lessons: Lesson[];
}

export interface LessonPedagogyDetailResponse {
  lesson: Lesson;
  vocabularies: Vocabulary[];
  questions_count: number;
  teaching_guide: {
    parent_tips: string[];
    expert_standards: string[];
  };
}

export const curriculumService = {
  // Lấy toàn bộ lộ trình mẫu 3-8 tuổi
  getRoadmap: async (ages?: string | string[]): Promise<CurriculumStage[]> => {
    const ageFilter = Array.isArray(ages) ? ages.join(',') : ages;
    const res = await API.get<CurriculumStage[]>('/curriculum/roadmap', {
      params: ageFilter ? { ages: ageFilter } : undefined
    });
    return res.data;
  },

  // Tìm kiếm bài học & tài liệu mẫu theo tuổi, kỹ năng, từ khóa
  searchMaterials: async (params: SearchMaterialsParams): Promise<SearchMaterialsResponse> => {
    const res = await API.get<SearchMaterialsResponse>('/curriculum/materials', { params });
    return res.data;
  },

  // Lấy chi tiết hướng dẫn sư phạm & tài liệu mẫu của bài học
  getLessonPedagogy: async (lessonId: number): Promise<LessonPedagogyDetailResponse> => {
    const res = await API.get<LessonPedagogyDetailResponse>(`/curriculum/lessons/${lessonId}/pedagogy`);
    return res.data;
  }
};
