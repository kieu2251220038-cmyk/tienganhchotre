import API from './api';

export interface PlacementQuestionOption {
  text: string;
  subText: string;
  emoji: string;
  isCorrect: boolean;
}

export interface PlacementQuestion {
  id: number;
  lessonId?: number;
  ageGroup?: number;
  topicName?: string;
  promptVi: string;
  promptEn: string;
  speakText: string;
  image: string;
  options: PlacementQuestionOption[];
}

export const placementService = {
  async getQuestions(): Promise<PlacementQuestion[]> {
    const response = await API.get<PlacementQuestion[]>('/placement/questions');
    if (!Array.isArray(response.data) || response.data.length === 0) {
      throw new Error('Backend không trả về câu hỏi khảo sát.');
    }
    return response.data;
  }
};
