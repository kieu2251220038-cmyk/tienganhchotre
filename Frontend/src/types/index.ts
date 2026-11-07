export type UserRole = 'USER' | 'ADMIN' | 'EXPERT' | 'PARENT';

export interface User {
  id: number;
  username: string;
  display_name: string;
  role: UserRole;
  age_group?: '3' | '4' | '5' | '6' | '7' | '8' | string;
  parent_id?: number | null;
  daily_goal_minutes?: number;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  age_group: string;
  status: 'DRAFT' | 'PUBLISHED';
  thumbnail?: string;
}

export interface Topic {
  id: number;
  course_id: number;
  name: string;
  description: string;
  sort_order: number;
  status: 'DRAFT' | 'PUBLISHED';
  icon?: string;
  color?: string;
  total_words?: number;
  lessons?: Lesson[];
  vocabularies?: Vocabulary[];
  lesson_count?: number;
  vocabulary_count?: number;
}

export type LessonType = 'VIDEO' | 'FLASHCARD' | 'SPEAKING' | 'QUIZ' | 'GAME';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Lesson {
  id: number;
  topic_id: number;
  mini_game_id?: number | null;
  title: string;
  lesson_type: LessonType;
  difficulty: number;
  sort_order: number;
  status: 'DRAFT' | 'PUBLISHED';
  approval_status?: ApprovalStatus;
  target_age?: number;
  learning_outcomes?: string;
  sample_materials_url?: string;
  reviewed_by?: number | null;
  review_notes?: string | null;
  reviewed_at?: string | null;
  reviewer_name?: string;
  topic_name?: string;
  course_title?: string;
  age_group?: string;
  is_completed?: boolean;
  vocab_preview?: { word: string; meaning_vi: string; phonetic: string }[];
}

export interface CurriculumStage {
  course_id: number;
  title: string;
  age_group: string;
  stage: string;
  summary: string;
  cefr: string;
  coreFocus: string[];
  topics: Topic[];
  vocabulary_count?: number;
  lesson_count?: number;
}

export interface ExpertStats {
  total_lessons: number;
  approved_count: number;
  pending_count: number;
  rejected_count: number;
  approval_rate: number;
  by_age: { age_group: string; total: number; approved: number; pending: number }[];
}

export interface CurriculumStandard {
  age: string;
  focus: string;
  criteria: string[];
}

export interface ParentChild {
  id: number;
  username: string;
  display_name: string;
  age_group: string;
  daily_goal_minutes: number;
  created_at: string;
  current_streak: number;
  total_stars: number;
  total_coins: number;
  completed_lessons: number;
  relationship: string;
}

export interface ChildOverview {
  child: User;
  rewards: { current_streak: number; total_stars: number; total_coins: number };
  badges: { badge_name: string; badge_key?: string; earned_at: string }[];
  total_completed_lessons: number;
  system_total_lessons: number;
  overall_completion_percent: number;
  estimated_study_minutes: number;
  daily_goal_minutes: number;
  progress_by_age: {
    course_id: number;
    title: string;
    age_group: string;
    total_lessons: number;
    completed_lessons: number;
    percent: number;
  }[];
}

export interface ChildActivity {
  id: number;
  score: number;
  status: string;
  completed_at: string;
  lesson_id: number;
  lesson_title: string;
  lesson_type: LessonType;
  difficulty: number;
  topic_name: string;
  course_title: string;
  age_group: string;
}

export interface ChildVocabularyTopicProgress {
  courseId: number;
  ageGroup: string;
  topicId: number;
  topicName: string;
  learnedWords: number;
  totalWords: number;
  percent: number;
  lastLearnedAt?: string | null;
}

export interface ChildVocabularyProgress {
  childId: number;
  ageGroup: number;
  learnedVocabulary: number;
  totalVocabulary: number;
  masteryPercent: number;
  byTopic: ChildVocabularyTopicProgress[];
}

export interface ChildSkill {
  label: string;
  score: number;
  comment: string;
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
  media_id?: number;
  media_url?: string;
  is_correct: boolean | number;
}

export interface Question {
  id: number;
  lesson_id: number;
  question_type: 'MULTIPLE_CHOICE' | 'MATCHING' | 'FILL_IN_BLANK' | 'SPEAKING';
  question_text: string;
  media_id?: number;
  media_url?: string;
  points: number;
  answers?: Answer[];
}

export interface UserBadge {
  id: number;
  badge_name: string;
  badge_key?: string;
  earned_at: string;
}

export interface AvatarItem {
  id: number;
  name: string;
  emoji: string;
  cost: number;
  description: string;
  unlocked: boolean;
}

export interface UserRewardsData {
  user: User;
  total_stars: number;
  total_coins: number;
  current_streak: number;
  badges: UserBadge[];
  completed_lessons: { lesson_id: number; status: string; score: number }[];
  avatar_items?: AvatarItem[];
}
