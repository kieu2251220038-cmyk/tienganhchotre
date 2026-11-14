export interface MobileUser {
  id: number;
  username: string;
  display_name: string;
  role: string;
  age_group?: string | number;
}

export interface Lesson {
  id: number;
  topic_id: number;
  title: string;
  lesson_type: string;
  difficulty?: number;
  target_age?: string | number;
  learning_outcomes?: string;
  sample_materials_url?: string;
  mini_game_id?: number | null;
  is_completed?: boolean;
}

export interface Topic {
  id: number;
  name: string;
  description?: string;
  lesson_count?: number;
  vocabulary_count?: number;
  lessons: Lesson[];
}

export interface CurriculumStage {
  course_id: number;
  title: string;
  age_group: string | number;
  stage: string;
  summary: string;
  cefr: string;
  coreFocus: string[];
  topics: Topic[];
}

export interface Vocabulary {
  id: number;
  topic_id: number;
  word: string;
  meaning_vi: string;
  phonetic: string;
  image_url?: string;
  audio_url?: string;
}

export interface Answer {
  id: number;
  question_id: number;
  answer_text: string;
  media_url?: string;
  is_correct: boolean | number;
}

export interface Question {
  id: number;
  lesson_id: number;
  question_text: string;
  points: number;
  answers?: Answer[];
}

export interface LessonDetailResponse {
  lesson: Lesson;
  vocabularies: Vocabulary[];
  questions: Question[];
}

export interface RewardResult {
  starsEarned: number;
  coinsEarned: number;
  totalStars: number;
  totalCoins: number;
  currentStreak: number;
  totalCompleted: number;
  newBadges: string[];
  unlockedAvatars: { name: string; emoji: string }[];
  isFirstTime: boolean;
}

export interface RewardsData {
  user: MobileUser;
  total_stars: number;
  total_coins: number;
  current_streak: number;
  badges: { id: number; badge_name: string; earned_at: string }[];
  completed_lessons: { lesson_id: number; status: string; score: number }[];
}

export interface MiniGame {
  id: number;
  topic_id: number;
  name: string;
  game_type: string;
  difficulty: number;
  points: number;
  is_active: boolean | number;
  topic_name?: string;
  age_group?: string;
}
