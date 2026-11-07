import API from './api';

export type MiniGameType = 'MATCHING_PAIRS' | 'MEMORY_CARDS' | 'LISTEN_AND_PICK' | 'COUNT_OBJECTS' | 'ORDER_SENTENCE';

export interface MiniGame {
  id: number;
  topic_id: number;
  name: string;
  game_type: MiniGameType;
  difficulty: number;
  points: number;
  is_active: boolean | number;
  sort_order: number;
  topic_name: string;
  topic_sort_order?: number;
  course_id: number;
  course_title: string;
  age_group: string;
}

export interface MiniGamePayload {
  topic_id: number;
  name: string;
  game_type: MiniGameType;
  difficulty: number;
  points: number;
  is_active: boolean;
  sort_order: number;
}

export const adminMiniGameService = {
  async getAll(): Promise<MiniGame[]> {
    const response = await API.get('/admin/mini-games');
    return response.data;
  },

  async create(data: MiniGamePayload): Promise<void> {
    await API.post('/admin/mini-games', data);
  },

  async update(id: number, data: MiniGamePayload): Promise<void> {
    await API.put(`/admin/mini-games/${id}`, data);
  },

  async updateStatus(id: number, isActive: boolean): Promise<void> {
    await API.patch(`/admin/mini-games/${id}/status`, { is_active: isActive });
  },

  async remove(id: number): Promise<void> {
    await API.delete(`/admin/mini-games/${id}`);
  }
};

export const miniGameService = {
  async getActiveGames(filters: { courseId?: number; topicId?: number; gameId?: number } = {}): Promise<MiniGame[]> {
    const response = await API.get('/games', {
      params: {
        courseId: filters.courseId,
        topicId: filters.topicId,
        gameId: filters.gameId
      }
    });
    return response.data;
  }
};
