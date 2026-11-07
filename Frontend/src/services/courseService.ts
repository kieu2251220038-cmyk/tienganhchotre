import API from './api';
import type { Course, Topic, Lesson, Vocabulary, Question } from '../types';

// Chỉ dùng dữ liệu mẫu khi chủ động bật chế độ demo.
// Mặc định User phải sử dụng đúng dữ liệu Backend, kể cả khi API trả về [].
const USE_MOCK_DATA = false;

const MOCK_COURSES: Course[] = [
  { id: 1, title: 'Bậc 1: Bé 3 Tuổi - Khám Phá Mầm Non 🐣', description: 'Hình ảnh sinh động, âm thanh ngộ nghĩnh và sắc màu rực rỡ', age_group: '3', status: 'PUBLISHED' },
  { id: 2, title: 'Bậc 2: Bé 4 Tuổi - Nhận Biết Xung Quanh 🐥', description: 'Thế giới hoa quả, đồ chơi đáng yêu và bộ phận cơ thể', age_group: '4', status: 'PUBLISHED' },
  { id: 3, title: 'Bậc 3: Bé 5 Tuổi - Gia Đình & Bạn Bè 🐼', description: 'Gia đình thân yêu, tập đếm 1 đến 10 và hình khối', age_group: '5', status: 'PUBLISHED' },
  { id: 4, title: 'Bậc 4: Bé 6 Tuổi - Chuẩn Bị Vào Lớp 1 🦊', description: 'Đồ dùng học tập, trang phục mỗi ngày và cảm xúc vui buồn', age_group: '6', status: 'PUBLISHED' },
  { id: 5, title: 'Bậc 5: Bé 7 Tuổi - Tự Tin Giao Tiếp 🦁', description: 'Món ăn, đồ uống, thời tiết bốn mùa và hoạt động thể chất', age_group: '7', status: 'PUBLISHED' },
  { id: 6, title: 'Bậc 6: Bé 8 Tuổi - Siêu Nhí Khám Phá 🚀', description: 'Thiên nhiên kỳ thú, ước mơ nghề nghiệp và thói quen mỗi ngày', age_group: '8', status: 'PUBLISHED' }
];

const MOCK_TOPICS: Topic[] = [
  { id: 1, course_id: 1, name: 'Animals - Động vật 🐶', description: 'Gặp gỡ những người bạn động vật dễ thương', sort_order: 1, status: 'PUBLISHED', total_words: 8, color: '#58CC02' },
  { id: 2, course_id: 1, name: 'Colors - Màu sắc 🎨', description: 'Khám phá thế giới sắc màu rực rỡ quanh bé', sort_order: 2, status: 'PUBLISHED', total_words: 6, color: '#1CB0F6' },
  { id: 3, course_id: 1, name: 'Fruits - Hoa quả 🍎', description: 'Nhận biết các loại quả ngọt và dinh dưỡng', sort_order: 3, status: 'PUBLISHED', total_words: 8, color: '#FF9600' },
  { id: 4, course_id: 1, name: 'Numbers - Chữ số 🔢', description: 'Đếm số vui vẻ từ 1 đến 10', sort_order: 4, status: 'PUBLISHED', total_words: 10, color: '#CE82FF' }
];

const MOCK_LESSONS: Record<number, Lesson[]> = {
  1: [
    { id: 1, topic_id: 1, title: 'Pets - Thú cưng quen thuộc', lesson_type: 'FLASHCARD', difficulty: 1, sort_order: 1, status: 'PUBLISHED', is_completed: true },
    { id: 2, topic_id: 1, title: 'Wild Animals - Bài hát muông thú', lesson_type: 'VIDEO', difficulty: 1, sort_order: 2, status: 'PUBLISHED', is_completed: true },
    { id: 3, topic_id: 1, title: 'Quiz: Đoán tên con vật', lesson_type: 'QUIZ', difficulty: 1, sort_order: 3, status: 'PUBLISHED', is_completed: false },
    { id: 4, topic_id: 1, title: 'Mini Game: Ghép tranh & từ', lesson_type: 'GAME', difficulty: 1, sort_order: 4, status: 'PUBLISHED', is_completed: false },
    { id: 5, topic_id: 1, title: 'Luyện phát âm AI: Con vật yêu thích', lesson_type: 'QUIZ', difficulty: 1, sort_order: 5, status: 'PUBLISHED', is_completed: false }
  ]
};

const MOCK_VOCABULARIES: Record<number, Vocabulary[]> = {
  1: [
    { id: 1, topic_id: 1, word: 'Dog', meaning_vi: 'Con chó', phonetic: '/dɒɡ/', image_url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop' },
    { id: 2, topic_id: 1, word: 'Cat', meaning_vi: 'Con mèo', phonetic: '/kæt/', image_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&auto=format&fit=crop' },
    { id: 3, topic_id: 1, word: 'Bird', meaning_vi: 'Con chim', phonetic: '/bɜːd/', image_url: 'https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?w=500&auto=format&fit=crop' },
    { id: 4, topic_id: 1, word: 'Elephant', meaning_vi: 'Con voi', phonetic: '/ˈel.ɪ.fənt/', image_url: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=500&auto=format&fit=crop' },
    { id: 5, topic_id: 1, word: 'Monkey', meaning_vi: 'Con khỉ', phonetic: '/ˈmʌŋ.ki/', image_url: 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=500&auto=format&fit=crop' },
    { id: 6, topic_id: 1, word: 'Lion', meaning_vi: 'Sư tử', phonetic: '/ˈlaɪ.ən/', image_url: 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=500&auto=format&fit=crop' }
  ],
  2: [
    { id: 7, topic_id: 2, word: 'Red', meaning_vi: 'Màu đỏ', phonetic: '/red/', image_url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=500&auto=format&fit=crop' },
    { id: 8, topic_id: 2, word: 'Blue', meaning_vi: 'Màu xanh dương', phonetic: '/bluː/', image_url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=500&auto=format&fit=crop' },
    { id: 9, topic_id: 2, word: 'Yellow', meaning_vi: 'Màu vàng', phonetic: '/ˈjel.oʊ/', image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop' },
    { id: 10, topic_id: 2, word: 'Green', meaning_vi: 'Màu xanh lá', phonetic: '/ɡriːn/', image_url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=500&auto=format&fit=crop' }
  ]
};

const MOCK_QUESTIONS: Record<number, Question[]> = {
  3: [
    {
      id: 1,
      lesson_id: 3,
      question_type: 'MULTIPLE_CHOICE',
      question_text: 'Where is the Cat? 🐱',
      points: 10,
      answers: [
        { id: 1, question_id: 1, answer_text: 'Cat', media_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&auto=format&fit=crop', is_correct: true },
        { id: 2, question_id: 1, answer_text: 'Dog', media_url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop', is_correct: false },
        { id: 3, question_id: 1, answer_text: 'Bird', media_url: 'https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?w=500&auto=format&fit=crop', is_correct: false },
        { id: 4, question_id: 1, answer_text: 'Elephant', media_url: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=500&auto=format&fit=crop', is_correct: false }
      ]
    },
    {
      id: 2,
      lesson_id: 3,
      question_type: 'MULTIPLE_CHOICE',
      question_text: 'Which animal says "Woof Woof"? 🐶',
      points: 10,
      answers: [
        { id: 5, question_id: 2, answer_text: 'Dog', media_url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop', is_correct: true },
        { id: 6, question_id: 2, answer_text: 'Cat', media_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&auto=format&fit=crop', is_correct: false },
        { id: 7, question_id: 2, answer_text: 'Elephant', media_url: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=500&auto=format&fit=crop', is_correct: false },
        { id: 8, question_id: 2, answer_text: 'Lion', media_url: 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=500&auto=format&fit=crop', is_correct: false }
      ]
    },
    {
      id: 3,
      lesson_id: 3,
      question_type: 'MULTIPLE_CHOICE',
      question_text: 'What big animal has a long trunk? 🐘',
      points: 10,
      answers: [
        { id: 9, question_id: 3, answer_text: 'Elephant', media_url: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=500&auto=format&fit=crop', is_correct: true },
        { id: 10, question_id: 3, answer_text: 'Bird', media_url: 'https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?w=500&auto=format&fit=crop', is_correct: false },
        { id: 11, question_id: 3, answer_text: 'Dog', media_url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop', is_correct: false },
        { id: 12, question_id: 3, answer_text: 'Monkey', media_url: 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=500&auto=format&fit=crop', is_correct: false }
      ]
    }
  ]
};

export const courseService = {
  async getCourses(): Promise<Course[]> {
    try {
      const res = await API.get<Course[]>('/courses');
      if (!Array.isArray(res.data)) throw new Error('API /courses không trả về một mảng dữ liệu.');
      return res.data;
    } catch (error) {
      if (USE_MOCK_DATA) return MOCK_COURSES;
      throw error;
    }
  },

  async getTopicsByCourse(courseId: number | 'all'): Promise<Topic[]> {
    try {
      const res = await API.get<Topic[]>(`/content/courses/${courseId}/topics`);
      if (!Array.isArray(res.data)) throw new Error('API topics không trả về một mảng dữ liệu.');
      return res.data;
    } catch (error) {
      if (USE_MOCK_DATA) return MOCK_TOPICS;
      throw error;
    }
  },

  async getAllTopics(): Promise<Topic[]> {
    try {
      const res = await API.get<Topic[]>('/content/courses/all/topics');
      if (!Array.isArray(res.data)) throw new Error('API topics không trả về một mảng dữ liệu.');
      return res.data;
    } catch (error) {
      if (USE_MOCK_DATA) return MOCK_TOPICS;
      throw error;
    }
  },

  async getLessonsByTopic(topicId: number): Promise<Lesson[]> {
    try {
      const res = await API.get<Lesson[]>(`/content/topics/${topicId}/lessons`);
      if (!Array.isArray(res.data)) throw new Error('API lessons không trả về một mảng dữ liệu.');
      return res.data;
    } catch (error) {
      if (USE_MOCK_DATA) return MOCK_LESSONS[topicId] || MOCK_LESSONS[1];
      throw error;
    }
  },

  async getVocabulariesByTopic(topicId: number): Promise<Vocabulary[]> {
    try {
      const res = await API.get<Vocabulary[]>(`/content/topics/${topicId}/vocabularies`);
      if (!Array.isArray(res.data)) throw new Error('API vocabularies không trả về một mảng dữ liệu.');
      return res.data;
    } catch (error) {
      if (USE_MOCK_DATA) return MOCK_VOCABULARIES[topicId] || MOCK_VOCABULARIES[1];
      throw error;
    }
  },

  async getLessonDetail(lessonId: number): Promise<{ lesson: Lesson; vocabularies: Vocabulary[]; questions: Question[] }> {
    try {
      const res = await API.get<{ lesson: Lesson; vocabularies: Vocabulary[]; questions: Question[] }>(`/content/lessons/${lessonId}`);
      if (res.data && res.data.lesson) return res.data;
      throw new Error('API lesson detail không trả về bài học.');
    } catch (error) {
      if (!USE_MOCK_DATA) throw error;
    }

    const allLessons = Object.values(MOCK_LESSONS).flat();
    const lesson = allLessons.find(l => l.id === Number(lessonId)) || allLessons[0];
    const vocabularies = MOCK_VOCABULARIES[lesson.topic_id] || MOCK_VOCABULARIES[1];
    const questions = MOCK_QUESTIONS[lesson.id] || MOCK_QUESTIONS[3];

    return { lesson, vocabularies, questions };
  }
};
