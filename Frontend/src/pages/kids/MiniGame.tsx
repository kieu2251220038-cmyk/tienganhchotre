import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sounds, speakEnglish } from '../../utils/soundEffects';
import { authService } from '../../services/authService';
import { progressService, type LessonRewardResult } from '../../services/progressService';
import { miniGameService, type MiniGame } from '../../services/miniGameService';
import { courseService } from '../../services/courseService';
import { getVocabularyFallbackImage } from '../../utils/vocabularyVisuals';
import FireworksCelebration from '../../components/FireworksCelebration';
import RewardPopup from '../../components/RewardPopup';

// Định nghĩa dữ liệu từ vựng cho từng chủ đề trò chơi
interface GameWord {
  id: number;
  word: string;
  meaning: string;
  image: string;
}

interface GameTopic {
  id: string;
  name: string;
  emoji: string;
  color: string;
  words: GameWord[];
}

const GAME_TOPICS: GameTopic[] = [
  {
    id: 'animals',
    name: 'Động Vật',
    emoji: '🐶',
    color: '#10B981',
    words: [
      { id: 1, word: 'Dog', meaning: 'Con chó', image: getVocabularyFallbackImage('Dog') },
      { id: 2, word: 'Cat', meaning: 'Con mèo', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&auto=format&fit=crop' },
      { id: 3, word: 'Bird', meaning: 'Con chim', image: 'https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?w=400&auto=format&fit=crop' },
      { id: 4, word: 'Elephant', meaning: 'Con voi', image: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=400&auto=format&fit=crop' },
      { id: 5, word: 'Monkey', meaning: 'Con khỉ', image: 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=400&auto=format&fit=crop' },
      { id: 6, word: 'Lion', meaning: 'Sư tử', image: 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=400&auto=format&fit=crop' },
      { id: 7, word: 'Rabbit', meaning: 'Con thỏ', image: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&auto=format&fit=crop' },
      { id: 8, word: 'Duck', meaning: 'Con vịt', image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=400&auto=format&fit=crop' },
    ]
  },
  {
    id: 'colors',
    name: 'Màu Sắc',
    emoji: '🎨',
    color: '#3B82F6',
    words: [
      { id: 101, word: 'Red', meaning: 'Màu đỏ', image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&auto=format&fit=crop' },
      { id: 102, word: 'Blue', meaning: 'Màu xanh dương', image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&auto=format&fit=crop' },
      { id: 103, word: 'Yellow', meaning: 'Màu vàng', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop' },
      { id: 104, word: 'Green', meaning: 'Màu xanh lá', image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&auto=format&fit=crop' },
      { id: 105, word: 'Orange', meaning: 'Màu cam', image: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=400&auto=format&fit=crop' },
      { id: 106, word: 'Purple', meaning: 'Màu tím', image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop' },
    ]
  },
  {
    id: 'fruits',
    name: 'Hoa Quả',
    emoji: '🍎',
    color: '#F59E0B',
    words: [
      { id: 201, word: 'Apple', meaning: 'Quả táo', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&auto=format&fit=crop' },
      { id: 202, word: 'Banana', meaning: 'Quả chuối', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&auto=format&fit=crop' },
      { id: 203, word: 'Orange', meaning: 'Quả cam', image: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400&auto=format&fit=crop' },
      { id: 204, word: 'Strawberry', meaning: 'Dâu tây', image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&auto=format&fit=crop' },
      { id: 205, word: 'Watermelon', meaning: 'Dưa hấu', image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&auto=format&fit=crop' },
      { id: 206, word: 'Mango', meaning: 'Quả xoài', image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&auto=format&fit=crop' },
    ]
  },
  {
    id: 'toys',
    name: 'Đồ Chơi',
    emoji: '🧸',
    color: '#EC4899',
    words: [
      { id: 301, word: 'Ball', meaning: 'Quả bóng', image: 'https://images.unsplash.com/photo-1515238152791-8216bfdf89a7?w=400&auto=format&fit=crop' },
      { id: 302, word: 'Car', meaning: 'Ô tô đồ chơi', image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=400&auto=format&fit=crop' },
      { id: 303, word: 'Robot', meaning: 'Người máy', image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&auto=format&fit=crop' },
      { id: 304, word: 'Teddy Bear', meaning: 'Gấu bông', image: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=400&auto=format&fit=crop' },
    ]
  },
  {
    id: 'school',
    name: 'Trường Học',
    emoji: '🎒',
    color: '#8B5CF6',
    words: [
      { id: 401, word: 'Book', meaning: 'Quyển sách', image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop' },
      { id: 402, word: 'Pen', meaning: 'Bút mực', image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&auto=format&fit=crop' },
      { id: 403, word: 'Pencil', meaning: 'Bút chì', image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&auto=format&fit=crop' },
      { id: 404, word: 'School Bag', meaning: 'Cặp sách', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&auto=format&fit=crop' },
    ]
  },
  {
    id: 'numbers',
    name: 'Số Đếm',
    emoji: '🔢',
    color: '#0EA5E9',
    words: [
      { id: 501, word: 'One', meaning: 'Một', image: getVocabularyFallbackImage('One') },
      { id: 502, word: 'Two', meaning: 'Hai', image: getVocabularyFallbackImage('Two') },
      { id: 503, word: 'Three', meaning: 'Ba', image: getVocabularyFallbackImage('Three') },
      { id: 504, word: 'Four', meaning: 'Bốn', image: getVocabularyFallbackImage('Four') },
      { id: 505, word: 'Five', meaning: 'Năm', image: getVocabularyFallbackImage('Five') }
    ]
  },
  {
    id: 'shapes',
    name: 'Hình Dạng',
    emoji: '🔷',
    color: '#8B5CF6',
    words: [
      { id: 601, word: 'Circle', meaning: 'Hình tròn', image: getVocabularyFallbackImage('Circle') },
      { id: 602, word: 'Square', meaning: 'Hình vuông', image: getVocabularyFallbackImage('Square') },
      { id: 603, word: 'Triangle', meaning: 'Hình tam giác', image: getVocabularyFallbackImage('Triangle') },
      { id: 604, word: 'Star', meaning: 'Ngôi sao', image: getVocabularyFallbackImage('Star') }
    ]
  },
  {
    id: 'family',
    name: 'Gia Đình',
    emoji: '👨‍👩‍👧‍👦',
    color: '#EC4899',
    words: [
      { id: 701, word: 'Father', meaning: 'Bố', image: getVocabularyFallbackImage('Father') },
      { id: 702, word: 'Mother', meaning: 'Mẹ', image: getVocabularyFallbackImage('Mother') },
      { id: 703, word: 'Sister', meaning: 'Chị/em gái', image: getVocabularyFallbackImage('Sister') },
      { id: 704, word: 'Brother', meaning: 'Anh/em trai', image: getVocabularyFallbackImage('Brother') }
    ]
  },
  {
    id: 'body',
    name: 'Cơ Thể',
    emoji: '🙌',
    color: '#F97316',
    words: [
      { id: 801, word: 'Head', meaning: 'Đầu', image: getVocabularyFallbackImage('Head') },
      { id: 802, word: 'Eyes', meaning: 'Mắt', image: getVocabularyFallbackImage('Eyes') },
      { id: 803, word: 'Nose', meaning: 'Mũi', image: getVocabularyFallbackImage('Nose') },
      { id: 804, word: 'Mouth', meaning: 'Miệng', image: getVocabularyFallbackImage('Mouth') }
    ]
  },
  {
    id: 'feelings',
    name: 'Cảm Xúc',
    emoji: '😀',
    color: '#EAB308',
    words: [
      { id: 851, word: 'Happy', meaning: 'Vui', image: getVocabularyFallbackImage('Happy') },
      { id: 852, word: 'Sad', meaning: 'Buồn', image: getVocabularyFallbackImage('Sad') },
      { id: 853, word: 'Angry', meaning: 'Tức giận', image: getVocabularyFallbackImage('Angry') },
      { id: 854, word: 'Tired', meaning: 'Mệt mỏi', image: getVocabularyFallbackImage('Tired') }
    ]
  },
  {
    id: 'greetings',
    name: 'Chào Hỏi',
    emoji: '👋',
    color: '#8B5CF6',
    words: [
      { id: 1001, word: 'Hello', meaning: 'Xin chào', image: getVocabularyFallbackImage('Hello') },
      { id: 1002, word: 'Goodbye', meaning: 'Tạm biệt', image: getVocabularyFallbackImage('Goodbye') },
      { id: 1003, word: 'Good morning', meaning: 'Chào buổi sáng', image: getVocabularyFallbackImage('Good morning') },
      { id: 1004, word: 'Good afternoon', meaning: 'Chào buổi chiều', image: getVocabularyFallbackImage('Good afternoon') }
    ]
  },
  {
    id: 'about me',
    name: 'Giới Thiệu Bản Thân',
    emoji: '🙋',
    color: '#6366F1',
    words: [
      { id: 1051, word: 'Name', meaning: 'Tên', image: getVocabularyFallbackImage('Name') },
      { id: 1052, word: 'Age', meaning: 'Tuổi', image: getVocabularyFallbackImage('Age') },
      { id: 1053, word: 'Six', meaning: 'Sáu', image: getVocabularyFallbackImage('Six') },
      { id: 1054, word: 'Friend', meaning: 'Bạn bè', image: getVocabularyFallbackImage('Friend') }
    ]
  },
  {
    id: 'school things',
    name: 'Đồ Dùng Học Tập',
    emoji: '🎒',
    color: '#F97316',
    words: [
      { id: 1101, word: 'Pencil', meaning: 'Bút chì', image: getVocabularyFallbackImage('Pencil') },
      { id: 1102, word: 'Notebook', meaning: 'Vở', image: getVocabularyFallbackImage('Notebook') },
      { id: 1103, word: 'Ruler', meaning: 'Thước kẻ', image: getVocabularyFallbackImage('Ruler') },
      { id: 1104, word: 'Eraser', meaning: 'Cục tẩy', image: getVocabularyFallbackImage('Eraser') }
    ]
  },
  {
    id: 'simple questions',
    name: 'Hỏi Đáp Đơn Giản',
    emoji: '❓',
    color: '#0EA5E9',
    words: [
      { id: 1151, word: 'What', meaning: 'Cái gì', image: getVocabularyFallbackImage('What') },
      { id: 1152, word: 'Color', meaning: 'Màu sắc', image: getVocabularyFallbackImage('Color') },
      { id: 1153, word: 'This', meaning: 'Cái này', image: getVocabularyFallbackImage('This') },
      { id: 1154, word: 'That', meaning: 'Cái kia', image: getVocabularyFallbackImage('That') }
    ]
  },
  {
    id: 'daily routine',
    name: 'Hoạt Động Hằng Ngày',
    emoji: '🗓️',
    color: '#F59E0B',
    words: [
      { id: 1201, word: 'Wake up', meaning: 'Thức dậy', image: getVocabularyFallbackImage('Wake up') },
      { id: 1202, word: 'Brush teeth', meaning: 'Đánh răng', image: getVocabularyFallbackImage('Brush teeth') },
      { id: 1203, word: 'Eat breakfast', meaning: 'Ăn sáng', image: getVocabularyFallbackImage('Eat breakfast') },
      { id: 1204, word: 'Go to school', meaning: 'Đi học', image: getVocabularyFallbackImage('Go to school') }
    ]
  },
  {
    id: 'weather',
    name: 'Thời Tiết',
    emoji: '🌤️',
    color: '#0EA5E9',
    words: [
      { id: 1251, word: 'Sunny', meaning: 'Có nắng', image: getVocabularyFallbackImage('Sunny') },
      { id: 1252, word: 'Rainy', meaning: 'Có mưa', image: getVocabularyFallbackImage('Rainy') },
      { id: 1253, word: 'Cloudy', meaning: 'Nhiều mây', image: getVocabularyFallbackImage('Cloudy') },
      { id: 1254, word: 'Windy', meaning: 'Có gió', image: getVocabularyFallbackImage('Windy') }
    ]
  },
  {
    id: 'food & drinks',
    name: 'Đồ Ăn & Thức Uống',
    emoji: '🍽️',
    color: '#EF4444',
    words: [
      { id: 1301, word: 'Milk', meaning: 'Sữa', image: getVocabularyFallbackImage('Milk') },
      { id: 1302, word: 'Bread', meaning: 'Bánh mì', image: getVocabularyFallbackImage('Bread') },
      { id: 1303, word: 'Rice', meaning: 'Cơm', image: getVocabularyFallbackImage('Rice') },
      { id: 1304, word: 'Egg', meaning: 'Trứng', image: getVocabularyFallbackImage('Egg') }
    ]
  },
  {
    id: 'jobs',
    name: 'Nghề Nghiệp',
    emoji: '👩‍🔧',
    color: '#EF4444',
    words: [
      { id: 1351, word: 'Teacher', meaning: 'Giáo viên', image: getVocabularyFallbackImage('Teacher') },
      { id: 1352, word: 'Doctor', meaning: 'Bác sĩ', image: getVocabularyFallbackImage('Doctor') },
      { id: 1353, word: 'Farmer', meaning: 'Nông dân', image: getVocabularyFallbackImage('Farmer') },
      { id: 1354, word: 'Pilot', meaning: 'Phi công', image: getVocabularyFallbackImage('Pilot') }
    ]
  },
  {
    id: 'nature',
    name: 'Thiên Nhiên',
    emoji: '🌳',
    color: '#16A34A',
    words: [
      { id: 1401, word: 'Tree', meaning: 'Cây', image: getVocabularyFallbackImage('Tree') },
      { id: 1402, word: 'River', meaning: 'Sông', image: getVocabularyFallbackImage('River') },
      { id: 1403, word: 'Mountain', meaning: 'Núi', image: getVocabularyFallbackImage('Mountain') },
      { id: 1404, word: 'Forest', meaning: 'Rừng', image: getVocabularyFallbackImage('Forest') }
    ]
  }
];

const COUNTING_OBJECTS: GameWord[] = [
  { id: 901, word: 'Apple', meaning: 'quả táo', image: getVocabularyFallbackImage('Apple') },
  { id: 902, word: 'Ball', meaning: 'quả bóng', image: getVocabularyFallbackImage('Ball') },
  { id: 903, word: 'Star', meaning: 'ngôi sao', image: getVocabularyFallbackImage('Star') },
  { id: 904, word: 'Fish', meaning: 'con cá', image: getVocabularyFallbackImage('Fish') }
];

const SENTENCE_BANK: Record<string, string[]> = {
  greetings: ['Hello, my name is Anna.', 'Good morning, teacher.', 'Nice to meet you.', 'Goodbye, see you soon.'],
  'about me': ['My name is Anna.', 'I am six years old.', 'I like English.', 'This is my friend.'],
  'school things': ['This is my pencil.', 'I have a blue notebook.', 'Where is my ruler?', 'This is my school bag.'],
  'simple questions': ['What is this?', 'What color is it?', 'Is this your book?', 'Yes, it is.'],
  'daily routine': ['I wake up at seven.', 'I brush my teeth every morning.', 'I eat breakfast in the morning.', 'I go to school every day.'],
  weather: ['It is sunny today.', 'It is rainy today.', 'It is cloudy today.', 'It is windy today.'],
  'food & drinks': ['I would like some milk.', 'I eat bread for breakfast.', 'I like rice.', 'I would like an egg.'],
  jobs: ['A teacher helps children learn.', 'A doctor helps sick people.', 'A farmer grows food.', 'A pilot flies an airplane.'],
  nature: ['The tree is tall and green.', 'The river flows through the forest.', 'The mountain is high.', 'Many animals live in the forest.']
};

type GameMode = 'MATCH' | 'MEMORY' | 'LISTEN' | 'COUNT' | 'ORDER';

interface MatchItem {
  id: number;
  word: string;
  image: string;
  matched: boolean;
}

interface MemoryCard {
  uid: string;
  pairId: number;
  type: 'WORD' | 'IMAGE';
  text?: string;
  image?: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface CountQuestion {
  object: GameWord;
  count: number;
  options: number[];
}

interface SentenceToken {
  id: string;
  text: string;
}

interface SentenceQuestion {
  sentence: string;
  tokens: SentenceToken[];
  shuffledTokens: SentenceToken[];
}

export default function MiniGame() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gameLessonId = Number(searchParams.get('lessonId'));

  // Chỉ nhận game đang bật từ CSDL. Không dùng localStorage để tránh trạng thái cũ.
  const [gameConfigs, setGameConfigs] = useState<MiniGame[]>([]);
  const [gameTopics, setGameTopics] = useState<GameTopic[]>(GAME_TOPICS);
  const [loadingGames, setLoadingGames] = useState(true);
  const [gameLoadError, setGameLoadError] = useState('');

  const getTopicPoints = (topicId: string) => {
    const conf = gameConfigs.find((c) => String(c.id) === topicId);
    return conf ? conf.points : 100;
  };

  const completeGame = async (scoreValue: number) => {
    const user = authService.getCurrentUser();
    try {
      const result = await progressService.completeLesson(user.id, gameLessonId, scoreValue);
      if (result) setReward(result);
    } catch (error) {
      console.error('Không thể lưu phần thưởng mini-game:', error);
    }
  };

  const getModeForGame = (game: MiniGame): GameMode => {
    if (game.game_type === 'MEMORY_CARDS') return 'MEMORY';
    if (game.game_type === 'LISTEN_AND_PICK') return 'LISTEN';
    if (game.game_type === 'COUNT_OBJECTS') return 'COUNT';
    if (game.game_type === 'ORDER_SENTENCE') return 'ORDER';
    return 'MATCH';
  };

  const getFallbackTopic = (topicName: string): GameTopic => {
    const normalizedName = topicName.toLowerCase();
    return GAME_TOPICS.find((topic) => normalizedName.includes(topic.id)) || GAME_TOPICS[0];
  };

  // Tab chế độ và chủ đề
  const [currentMode, setCurrentMode] = useState<GameMode>('MATCH');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');

  // Điểm số
  const [score, setScore] = useState<number>(0);
  const [round, setRound] = useState<number>(1);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationKey, setCelebrationKey] = useState(0);
  const [reward, setReward] = useState<LessonRewardResult | null>(null);

  const celebrateCorrectAnswer = () => {
    setCelebrationKey((key) => key + 1);
    setShowCelebration(true);
  };

  // ================= 1. STATE GAME 1: MATCHING =================
  const [matchWords, setMatchWords] = useState<MatchItem[]>([]);
  const [shuffledImages, setShuffledImages] = useState<MatchItem[]>([]);
  const [selectedWordId, setSelectedWordId] = useState<number | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);

  // ================= 2. STATE GAME 2: MEMORY FLIP =================
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([]);
  const [flippedCardIds, setFlippedCardIds] = useState<string[]>([]);

  // ================= 3. STATE GAME 3: LISTEN & PICK =================
  const [targetWord, setTargetWord] = useState<GameWord | null>(null);
  const [listenOptions, setListenOptions] = useState<GameWord[]>([]);
  const [listenSuccessCount, setListenSuccessCount] = useState<number>(0);

  // ================= 4. STATE GAME ĐẾM ĐỒ VẬT =================
  const [countQuestion, setCountQuestion] = useState<CountQuestion | null>(null);
  const [countSuccessCount, setCountSuccessCount] = useState<number>(0);

  // ================= 5. STATE GAME SẮP XẾP CÂU =================
  const [sentenceQuestion, setSentenceQuestion] = useState<SentenceQuestion | null>(null);
  const [selectedSentenceTokens, setSelectedSentenceTokens] = useState<SentenceToken[]>([]);
  const [sentenceSuccessCount, setSentenceSuccessCount] = useState<number>(0);

  const activeTopic = gameTopics.find((t) => t.id === selectedTopicId) || gameTopics[0] || GAME_TOPICS[0];

  useEffect(() => {
    const requestedGameId = Number(searchParams.get('gameId'));
    const loadGames = async () => {
      if (!requestedGameId || !gameLessonId) {
        setGameLoadError('Bé hãy mở trò chơi từ chặng GAME trong lộ trình học nhé!');
        setGameTopics([]);
        setLoadingGames(false);
        return;
      }
      try {
        // Mini-game không được dùng để học vượt bậc tuổi. Kiểm tra lại bài học
        // tại màn hình game để chặn cả trường hợp truy cập bằng URL trực tiếp.
        const lessonDetail = await courseService.getLessonDetail(gameLessonId);
        const lessonAge = Number(lessonDetail.lesson.target_age || lessonDetail.lesson.age_group || 0);
        const user = authService.getCurrentUser();
        const accountAge = Number(user.age_group);
        const maxInteractiveAge = Number.isInteger(accountAge)
          ? Math.max(3, Math.min(8, accountAge))
          : 3;

        if (maxInteractiveAge < 8 && lessonAge > maxInteractiveAge) {
          setGameLoadError(`📚 Mini-game của Bậc ${lessonAge} tuổi chưa mở. Tài khoản ${maxInteractiveAge} tuổi chỉ được học trước bài học kiến thức, không được học vượt mini-game.`);
          setGameTopics([]);
          return;
        }

        const requestedConfigs = await miniGameService.getActiveGames({ gameId: requestedGameId });
        const requestedGame = requestedConfigs[0];
        const configs = requestedGame
          ? await miniGameService.getActiveGames({ topicId: requestedGame.topic_id })
          : requestedConfigs;
        const configuredTopics = await Promise.all(configs.map(async (game) => {
          const fallback = getFallbackTopic(game.topic_name);
          const vocabularies = await courseService.getVocabulariesByTopic(game.topic_id);
          const words = vocabularies.map((vocabulary) => ({
            id: vocabulary.id,
            word: vocabulary.word,
            meaning: vocabulary.meaning_vi,
            image: vocabulary.image_url || getVocabularyFallbackImage(vocabulary.word)
          }));
          return {
            id: String(game.id),
            name: game.topic_name,
            emoji: fallback.emoji,
            color: fallback.color,
            words: words.length > 0 ? words : fallback.words
          };
        }));

        setGameConfigs(configs);
        setGameTopics(configuredTopics);
        const initialGame = configs.find((game) => game.id === requestedGameId) || configs[0];
        if (initialGame) {
          setSelectedTopicId(String(initialGame.id));
          setCurrentMode(getModeForGame(initialGame));
        }
      } catch {
        setGameLoadError('Không thể tải mini game. Bé hãy thử lại sau nhé!');
        setGameTopics([]);
      } finally {
        setLoadingGames(false);
      }
    };
    void loadGames();
  }, [searchParams, gameLessonId]);

  // Khởi tạo trò chơi theo chế độ
  useEffect(() => {
    if (selectedTopicId && gameTopics.length > 0) {
      initGameByMode(currentMode, selectedTopicId, 1);
    }
  }, [currentMode, selectedTopicId, gameTopics]);

  const initGameByMode = (mode: GameMode, topicId: string, currentRound: number = 1) => {
    const topic = gameTopics.find((t) => t.id === topicId) || gameTopics[0] || GAME_TOPICS[0];
    setIsGameOver(false);

    if (mode === 'MATCH') {
      // Lấy 4 từ cho vòng chơi này
      const startIndex = ((currentRound - 1) * 4) % topic.words.length;
      let wordsSlice = topic.words.slice(startIndex, startIndex + 4);
      if (wordsSlice.length < 4) {
        wordsSlice = topic.words.slice(0, 4);
      }

      const fresh: MatchItem[] = wordsSlice.map((w) => ({
        id: w.id,
        word: w.word,
        image: w.image,
        matched: false
      }));

      setMatchWords(fresh);
      setShuffledImages([...fresh].sort(() => Math.random() - 0.5));
      setSelectedWordId(null);
      setSelectedImageId(null);
    } else if (mode === 'MEMORY') {
      // Tạo 4 cặp thẻ (8 thẻ tổng cộng)
      const selectedWords = topic.words.slice(0, 4);
      const cards: MemoryCard[] = [];

      selectedWords.forEach((w) => {
        // Thẻ chữ
        cards.push({
          uid: `w-${w.id}`,
          pairId: w.id,
          type: 'WORD',
          text: w.word,
          isFlipped: false,
          isMatched: false
        });
        // Thẻ hình
        cards.push({
          uid: `img-${w.id}`,
          pairId: w.id,
          type: 'IMAGE',
          image: w.image,
          isFlipped: false,
          isMatched: false
        });
      });

      setMemoryCards(cards.sort(() => Math.random() - 0.5));
      setFlippedCardIds([]);
    } else if (mode === 'COUNT') {
      setCountSuccessCount(0);
      nextCountingQuestion();
    } else if (mode === 'ORDER') {
      setSentenceSuccessCount(0);
      setSelectedSentenceTokens([]);
      nextSentenceQuestion(topic);
    } else if (mode === 'LISTEN') {
      // Game Nghe: chọn 1 từ ngẫu nhiên và 3 từ gây nhiễu
      nextListenQuestion(topic);
    }
  };

  const nextCountingQuestion = () => {
    const object = COUNTING_OBJECTS[Math.floor(Math.random() * COUNTING_OBJECTS.length)] || COUNTING_OBJECTS[0];
    const count = Math.floor(Math.random() * 5) + 1;
    const options = new Set<number>([count, Math.max(1, count - 1), Math.min(5, count + 1)]);

    while (options.size < 4) {
      options.add(Math.floor(Math.random() * 5) + 1);
    }

    setCountQuestion({
      object,
      count,
      options: Array.from(options).sort(() => Math.random() - 0.5)
    });
    setTimeout(() => speakEnglish(`How many ${object.word.toLowerCase()}?`), 350);
  };

  const nextSentenceQuestion = (topic: GameTopic) => {
    const normalizedTopic = topic.name.toLowerCase();
    const bankKey = Object.keys(SENTENCE_BANK).find((key) => normalizedTopic.includes(key)) || 'greetings';
    const sentenceBank = SENTENCE_BANK[bankKey] || SENTENCE_BANK.greetings;
    const sentence = sentenceBank[Math.floor(Math.random() * sentenceBank.length)] || sentenceBank[0];
    const tokens = sentence.split(' ').map((text, index) => ({ id: `${index}-${text}`, text }));

    setSentenceQuestion({
      sentence,
      tokens,
      shuffledTokens: [...tokens].sort(() => Math.random() - 0.5)
    });
    setSelectedSentenceTokens([]);
    setTimeout(() => speakEnglish(sentence), 350);
  };

  const nextListenQuestion = (topic: GameTopic) => {
    const shuffled = [...topic.words].sort(() => Math.random() - 0.5);
    const chosen = shuffled[0];
    const options = shuffled.slice(0, 4).sort(() => Math.random() - 0.5);

    setTargetWord(chosen);
    setListenOptions(options);

    // Tự động phát âm từ cần tìm
    setTimeout(() => {
      speakEnglish(chosen.word);
    }, 400);
  };

  // ================= XỬ LÝ GAME 1: MATCHING =================
  const handleSelectWord = (id: number) => {
    sounds.playClick();
    setSelectedWordId(id);
    const item = matchWords.find((i) => i.id === id);
    if (item) speakEnglish(item.word);
    checkMatch(id, selectedImageId);
  };

  const handleSelectImage = (id: number) => {
    sounds.playClick();
    setSelectedImageId(id);
    checkMatch(selectedWordId, id);
  };

  const checkMatch = (wordId: number | null, imgId: number | null) => {
    if (wordId !== null && imgId !== null) {
      if (wordId === imgId) {
        sounds.playCorrect();
        celebrateCorrectAnswer();
        const updatedWords = matchWords.map((i) => (i.id === wordId ? { ...i, matched: true } : i));
        setMatchWords(updatedWords);
        setShuffledImages((prev) => prev.map((i) => (i.id === wordId ? { ...i, matched: true } : i)));
        setScore((prev) => prev + 25);
        setSelectedWordId(null);
        setSelectedImageId(null);

        if (updatedWords.every((i) => i.matched)) {
          sounds.playVictory();
          setIsGameOver(true);
          void completeGame(getTopicPoints(selectedTopicId));
        }
      } else {
        sounds.playWrong();
        setTimeout(() => {
          setSelectedWordId(null);
          setSelectedImageId(null);
        }, 500);
      }
    }
  };

  const handleNextRoundMatch = () => {
    const nextR = round + 1;
    setRound(nextR);
    initGameByMode('MATCH', selectedTopicId, nextR);
  };

  // ================= XỬ LÝ GAME 2: MEMORY FLIP =================
  const handleFlipCard = (card: MemoryCard) => {
    if (card.isFlipped || card.isMatched || flippedCardIds.length >= 2) return;

    sounds.playClick();
    if (card.type === 'WORD' && card.text) speakEnglish(card.text);

    const newCards = memoryCards.map((c) => (c.uid === card.uid ? { ...c, isFlipped: true } : c));
    setMemoryCards(newCards);

    const newFlipped = [...flippedCardIds, card.uid];
    setFlippedCardIds(newFlipped);

    if (newFlipped.length === 2) {
      const card1 = newCards.find((c) => c.uid === newFlipped[0]);
      const card2 = newCards.find((c) => c.uid === newFlipped[1]);

      if (card1 && card2 && card1.pairId === card2.pairId) {
        // Khớp cặp thẻ!
        sounds.playCorrect();
        celebrateCorrectAnswer();
        setScore((prev) => prev + 30);
        setTimeout(() => {
          const matchedCards = newCards.map((c) =>
            c.uid === card1.uid || c.uid === card2.uid ? { ...c, isMatched: true } : c
          );
          setMemoryCards(matchedCards);
          setFlippedCardIds([]);

          if (matchedCards.every((c) => c.isMatched)) {
            sounds.playVictory();
            setIsGameOver(true);
            void completeGame(getTopicPoints(selectedTopicId));
          }
        }, 600);
      } else {
        // Sai cặp thẻ
        sounds.playWrong();
        setTimeout(() => {
          const resetFlipped = newCards.map((c) =>
            c.uid === card1?.uid || c.uid === card2?.uid ? { ...c, isFlipped: false } : c
          );
          setMemoryCards(resetFlipped);
          setFlippedCardIds([]);
        }, 900);
      }
    }
  };

  // ================= XỬ LÝ GAME 3: LISTEN & PICK =================
  const handleAnswerListen = (option: GameWord) => {
    if (!targetWord) return;

    if (option.id === targetWord.id) {
      sounds.playCorrect();
      celebrateCorrectAnswer();
      setScore((prev) => prev + 20);
      const nextCount = listenSuccessCount + 1;
      setListenSuccessCount(nextCount);

      if (nextCount >= 5) {
        sounds.playVictory();
        setIsGameOver(true);
        void completeGame(getTopicPoints(selectedTopicId));
      } else {
        setTimeout(() => {
          nextListenQuestion(activeTopic);
        }, 600);
      }
    } else {
      sounds.playWrong();
    }
  };

  const handleReplayVoice = () => {
    sounds.playClick();
    if (targetWord) speakEnglish(targetWord.word);
  };

  const handleAnswerCount = (answer: number) => {
    if (!countQuestion) return;
    sounds.playClick();

    if (answer === countQuestion.count) {
      sounds.playCorrect();
      celebrateCorrectAnswer();
      setScore((prev) => prev + 20);
      const nextCount = countSuccessCount + 1;
      setCountSuccessCount(nextCount);

      if (nextCount >= 5) {
        sounds.playVictory();
        setIsGameOver(true);
        void completeGame(getTopicPoints(selectedTopicId));
      } else {
        setTimeout(nextCountingQuestion, 700);
      }
    } else {
      sounds.playWrong();
    }
  };

  const handleSelectSentenceToken = (token: SentenceToken) => {
    if (!sentenceQuestion || selectedSentenceTokens.some((item) => item.id === token.id)) return;
    sounds.playClick();
    const nextTokens = [...selectedSentenceTokens, token];
    setSelectedSentenceTokens(nextTokens);

    if (nextTokens.length === sentenceQuestion.tokens.length) {
      const answer = nextTokens.map((item) => item.text).join(' ');
      if (answer === sentenceQuestion.sentence) {
        sounds.playCorrect();
        celebrateCorrectAnswer();
        setScore((prev) => prev + 20);
        const nextCount = sentenceSuccessCount + 1;
        setSentenceSuccessCount(nextCount);

        if (nextCount >= 5) {
          sounds.playVictory();
          setIsGameOver(true);
          void completeGame(getTopicPoints(selectedTopicId));
        } else {
          setTimeout(() => nextSentenceQuestion(activeTopic), 700);
        }
      } else {
        sounds.playWrong();
        setTimeout(() => setSelectedSentenceTokens([]), 700);
      }
    }
  };

  if (loadingGames) {
    return <div className="card-kid" style={{ maxWidth: '700px', margin: '40px auto', padding: '40px', textAlign: 'center', color: '#64748B', fontWeight: 700 }}>⏳ Đang tải trò chơi phù hợp với lộ trình của bé...</div>;
  }

  if (gameLoadError) {
    return <div className="card-kid" style={{ maxWidth: '700px', margin: '40px auto', padding: '40px', textAlign: 'center', color: '#B45309', fontWeight: 700 }}>{gameLoadError}</div>;
  }

  if (gameConfigs.length === 0) {
    return <div className="card-kid" style={{ maxWidth: '700px', margin: '40px auto', padding: '40px', textAlign: 'center', color: '#64748B', fontWeight: 700 }}>🎮 Trò chơi của chủ đề này đang được thầy cô chuẩn bị. Bé hãy quay lại lộ trình để học bài khác nhé!</div>;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <FireworksCelebration
        visible={showCelebration}
        eventKey={celebrationKey}
        onDone={() => setShowCelebration(false)}
      />
      {reward && (
        <RewardPopup
          reward={reward}
          lessonTitle="Hoàn thành Mini Game"
          onContinue={() => { setReward(null); navigate('/dashboard'); }}
          onClose={() => setReward(null)}
        />
      )}
      {/* Một chặng mở cả bộ trò chơi của chủ đề để bé được luyện nhiều cách. */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        backgroundColor: '#ECFDF5',
        padding: '14px 20px',
        borderRadius: '24px',
        border: '2.5px solid #86EFAC',
        boxShadow: '0 4px 0 #BBF7D0',
        fontFamily: 'Fredoka, sans-serif',
        flexWrap: 'wrap'
      }}>
        <span style={{ color: '#166534', fontWeight: 800 }}>🎮 Trò chơi của chủ đề</span>
        <span style={{ color: '#15803D', fontWeight: 700 }}>{gameConfigs.find((game) => String(game.id) === selectedTopicId)?.name}</span>
      </div>

      {/* ================= 2. THÔNG TIN CHỦ ĐỀ ================= */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        {gameTopics.map((topic) => {
          const isSelected = selectedTopicId === topic.id;
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => {
                if (isSelected) return;
                const game = gameConfigs.find((item) => String(item.id) === topic.id);
                if (!game) return;
                sounds.playClick();
                setSelectedTopicId(topic.id);
                setCurrentMode(getModeForGame(game));
                setRound(1);
                setScore(0);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '16px',
                border: isSelected ? `2.5px solid ${topic.color}` : '2px solid #E2E8F0',
                backgroundColor: isSelected ? topic.color : '#FFFFFF',
                color: isSelected ? '#FFFFFF' : '#334155',
                fontFamily: 'Fredoka, sans-serif',
                fontWeight: 700,
                fontSize: '14px',
                whiteSpace: 'nowrap',
                boxShadow: isSelected ? `0 3px 0 ${topic.color}99` : 'none'
              }}
            >
              <span>{topic.emoji}</span>
              <span>{topic.name}</span>
            </button>
          );
        })}
      </div>

      {/* ================= 3. THANH ĐIỂM SỐ ================= */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: '14px 20px',
        borderRadius: '20px',
        border: '2px solid #E2E8F0',
        boxShadow: '0 4px 0 #E2E8F0',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-kid btn-outline"
          style={{ padding: '8px 16px', fontSize: '13px' }}
        >
          ← Về Lộ Trình
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Vòng chơi */}
          {currentMode === 'MATCH' && (
            <div style={{
              backgroundColor: '#ECFDF5',
              border: '1.5px solid #A7F3D0',
              padding: '6px 14px',
              borderRadius: '999px',
              fontFamily: 'Fredoka, sans-serif',
              fontWeight: 800,
              color: '#065F46',
              fontSize: '14px'
            }}>
              Vòng {round}
            </div>
          )}

          {/* Điểm số */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#FEF9C3',
            border: '1.5px solid #FDE047',
            padding: '6px 14px',
            borderRadius: '999px',
            fontFamily: 'Fredoka, sans-serif',
            fontWeight: 700,
            color: '#CA8A04',
            fontSize: '15px'
          }}>
            <span>⭐</span>
            <span>{score} Điểm</span>
          </div>
        </div>

        <button
          onClick={() => initGameByMode(currentMode, selectedTopicId, round)}
          className="btn-kid btn-outline"
          style={{ padding: '8px 16px', fontSize: '13px' }}
        >
          🔄 Chơi Lại
        </button>
      </div>

      {/* ================= 4. GIAO DIỆN CHƠI GAME TƯƠNG ỨNG ================= */}
      {isGameOver ? (
        <div className="card-kid animate-celebrate" style={{
          textAlign: 'center',
          padding: '48px 24px',
          backgroundColor: '#F0FDF4',
          border: '3px solid #86EFAC'
        }}>
          <div style={{ fontSize: '72px', marginBottom: '16px' }}>🎉⭐</div>
          <h2 style={{ fontSize: '32px', color: '#166534', marginBottom: '8px' }}>
            Xuất Sắc Quá Bé Ơi!
          </h2>
          <p style={{ fontSize: '16px', color: '#15803D', fontWeight: 600, marginBottom: '24px' }}>
            Bé đạt được <strong>{score} Điểm</strong>. {reward ? <>Bé nhận ngay <strong>+{reward.starsEarned} Sao Vàng ⭐</strong>!</> : 'Phần thưởng đang được lưu...'}
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {currentMode === 'MATCH' && (
              <button
                onClick={handleNextRoundMatch}
                className="btn-kid btn-primary"
                style={{ fontSize: '15px', padding: '12px 28px' }}
              >
                🚀 Sang Vòng Tiếp Theo
              </button>
            )}

            <button
              onClick={() => initGameByMode(currentMode, selectedTopicId, 1)}
              className="btn-kid btn-outline"
              style={{ fontSize: '15px', padding: '12px 24px' }}
            >
              🔄 Chơi Lại Từ Đầu
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="btn-kid btn-warning"
              style={{ fontSize: '15px', padding: '12px 24px' }}
            >
              🗺️ Về Lộ Trình
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ========== CHẾ ĐỘ 1: NỐI TỪ VỰNG & HÌNH ẢNH ========== */}
          {currentMode === 'MATCH' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                backgroundColor: '#ECFDF5',
                border: '2px solid #A7F3D0',
                borderRadius: '16px',
                padding: '12px 20px',
                textAlign: 'center',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '15px',
                fontWeight: 600,
                color: '#065F46'
              }}>
                👉 Bé hãy chạm vào <strong>1 Thẻ Từ Vựng</strong> bên trái rồi chọn <strong>1 Hình Ảnh</strong> tương ứng bên phải nhé!
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Cột Từ Vựng */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ fontSize: '19px', color: '#1E293B', textAlign: 'center', margin: 0, fontWeight: 800 }}>
                    📖 Thẻ Từ Vựng
                  </h3>
                  {matchWords.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => !item.matched && handleSelectWord(item.id)}
                      style={{
                        padding: '22px 20px',
                        backgroundColor: item.matched ? '#F1F5F9' : selectedWordId === item.id ? '#D1FAE5' : '#FFFFFF',
                        border: item.matched ? '2px dashed #CBD5E1' : selectedWordId === item.id ? '3px solid #10B981' : '2px solid #E2E8F0',
                        borderRadius: '18px',
                        cursor: item.matched ? 'default' : 'pointer',
                        textAlign: 'center',
                        fontFamily: 'Fredoka, sans-serif',
                        fontSize: '27px',
                        fontWeight: 800,
                        color: item.matched ? '#94A3B8' : selectedWordId === item.id ? '#065F46' : '#1E293B',
                        boxShadow: item.matched ? 'none' : '0 4px 0 #E2E8F0',
                        opacity: item.matched ? 0.45 : 1,
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <span>{item.word}</span>
                      <span>🔊</span>
                    </div>
                  ))}
                </div>

                {/* Cột Hình Ảnh */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ fontSize: '19px', color: '#1E293B', textAlign: 'center', margin: 0, fontWeight: 800 }}>
                    🖼️ Thẻ Hình Ảnh
                  </h3>
                  {shuffledImages.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => !item.matched && handleSelectImage(item.id)}
                      style={{
                        height: '108px',
                        backgroundColor: item.matched ? '#F1F5F9' : selectedImageId === item.id ? '#D1FAE5' : '#FFFFFF',
                        border: item.matched ? '2px dashed #CBD5E1' : selectedImageId === item.id ? '3px solid #10B981' : '2px solid #E2E8F0',
                        borderRadius: '18px',
                        cursor: item.matched ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: item.matched ? 'none' : '0 4px 0 #E2E8F0',
                        opacity: item.matched ? 0.45 : 1,
                        overflow: 'hidden',
                        padding: '4px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <img
                        src={item.image}
                        alt="Flashcard"
                        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'cover', borderRadius: '14px' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========== CHẾ ĐỘ ĐẾM ĐỒ VẬT TRONG ẢNH ========== */}
          {currentMode === 'COUNT' && countQuestion && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
              <div style={{
                width: '100%',
                maxWidth: '640px',
                backgroundColor: '#E0F2FE',
                border: '2px solid #7DD3FC',
                borderRadius: '18px',
                padding: '14px 20px',
                textAlign: 'center',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '20px',
                fontWeight: 700,
                color: '#075985'
              }}>
                🔢 Bé hãy đếm các hình bên dưới rồi chọn số đúng nhé!<br />
                <span style={{ fontSize: '17px' }}>How many {countQuestion.object.word.toLowerCase()}?</span>
                <span style={{ display: 'block', marginTop: '4px', fontSize: '15px' }}>
                  Đã đúng: {countSuccessCount}/5 câu
                </span>
              </div>

              <div style={{
                width: '100%',
                maxWidth: '640px',
                minHeight: '230px',
                backgroundColor: '#FFFFFF',
                border: '3px solid #BAE6FD',
                borderRadius: '24px',
                boxShadow: '0 6px 0 #7DD3FC',
                padding: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                {Array.from({ length: countQuestion.count }, (_, index) => (
                  <img
                    key={`${countQuestion.object.id}-${index}`}
                    src={countQuestion.object.image}
                    alt={countQuestion.object.word}
                    style={{ width: '112px', height: '88px', objectFit: 'cover', borderRadius: '14px', border: '2px solid #E0F2FE' }}
                  />
                ))}
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(70px, 1fr))',
                gap: '14px',
                width: '100%',
                maxWidth: '560px'
              }}>
                {countQuestion.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleAnswerCount(option)}
                    className="btn-kid btn-primary"
                    style={{ fontSize: '28px', padding: '16px 10px', borderRadius: '18px' }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ========== CHẾ ĐỘ SẮP XẾP CÂU NGẮN ========== */}
          {currentMode === 'ORDER' && sentenceQuestion && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
              <div style={{
                width: '100%',
                maxWidth: '700px',
                backgroundColor: '#F5F3FF',
                border: '2px solid #C4B5FD',
                borderRadius: '18px',
                padding: '14px 20px',
                textAlign: 'center',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '20px',
                fontWeight: 700,
                color: '#5B21B6'
              }}>
                🧩 Hãy chạm vào các từ để xếp thành câu đúng nhé!<br />
                <span style={{ fontSize: '15px' }}>Đã đúng: {sentenceSuccessCount}/5 câu</span>
              </div>

              <div style={{
                width: '100%',
                maxWidth: '700px',
                minHeight: '76px',
                backgroundColor: '#FFFFFF',
                border: '3px dashed #A78BFA',
                borderRadius: '20px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                {selectedSentenceTokens.length > 0 ? selectedSentenceTokens.map((token) => (
                  <span key={token.id} style={{
                    backgroundColor: '#EDE9FE',
                    color: '#5B21B6',
                    border: '2px solid #C4B5FD',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    fontFamily: 'Fredoka, sans-serif',
                    fontWeight: 800,
                    fontSize: '20px'
                  }}>
                    {token.text}
                  </span>
                )) : (
                  <span style={{ color: '#94A3B8', fontWeight: 700 }}>Câu của bé sẽ hiện ở đây...</span>
                )}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                maxWidth: '700px'
              }}>
                {sentenceQuestion.shuffledTokens.map((token) => {
                  const isSelected = selectedSentenceTokens.some((item) => item.id === token.id);
                  return (
                    <button
                      key={token.id}
                      type="button"
                      onClick={() => handleSelectSentenceToken(token)}
                      disabled={isSelected}
                      className="btn-kid btn-primary"
                      style={{
                        fontSize: '21px',
                        padding: '12px 16px',
                        borderRadius: '16px',
                        opacity: isSelected ? 0.45 : 1,
                        cursor: isSelected ? 'default' : 'pointer'
                      }}
                    >
                      {token.text}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => { sounds.playClick(); setSelectedSentenceTokens([]); }}
                className="btn-kid btn-outline"
                style={{ fontSize: '14px', padding: '10px 22px' }}
              >
                🔄 Xếp lại từ đầu
              </button>
            </div>
          )}

          {/* ========== CHẾ ĐỘ 2: LẬT BÀI TÌM CẶP GIỐNG NHAU (MEMORY CARD) ========== */}
          {currentMode === 'MEMORY' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                backgroundColor: '#EFF6FF',
                border: '2px solid #BFDBFE',
                borderRadius: '16px',
                padding: '12px 20px',
                textAlign: 'center',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '15px',
                fontWeight: 600,
                color: '#1E40AF'
              }}>
                👉 Chạm vào 2 lá bài bất kỳ để lật. Tìm đúng <strong>1 thẻ chữ</strong> và <strong>1 thẻ hình</strong> khớp nhau nhé!
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '14px'
              }}>
                {memoryCards.map((card) => {
                  const isOpen = card.isFlipped || card.isMatched;

                  return (
                    <div
                      key={card.uid}
                      onClick={() => handleFlipCard(card)}
                      style={{
                        height: '170px',
                        borderRadius: '20px',
                        cursor: card.isMatched ? 'default' : 'pointer',
                        backgroundColor: card.isMatched ? '#DCFCE7' : isOpen ? '#FFFFFF' : '#3B82F6',
                        border: card.isMatched ? '3px solid #86EFAC' : isOpen ? '3px solid #93C5FD' : '3px solid #2563EB',
                        boxShadow: isOpen ? '0 4px 0 #CBD5E1' : '0 6px 0 #1D4ED8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '10px',
                        transition: 'all 0.2s ease',
                        textAlign: 'center',
                        userSelect: 'none',
                        position: 'relative'
                      }}
                    >
                      {isOpen ? (
                        card.type === 'WORD' ? (
                          <div style={{
                            fontFamily: 'Fredoka, sans-serif',
                            fontSize: '25px',
                            fontWeight: 800,
                            color: '#1E293B'
                          }}>
                            {card.text}
                          </div>
                        ) : (
                          <img
                            src={card.image}
                            alt="Card"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                          />
                        )
                      ) : (
                        <div style={{ fontSize: '52px', color: '#FFFFFF' }}>
                          ❓
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========== CHẾ ĐỘ 3: NGHE ĐOÁN TRANH (LISTEN & PICK) ========== */}
          {currentMode === 'LISTEN' && targetWord && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
              <div style={{
                backgroundColor: '#FFFBEB',
                border: '2px solid #FDE68A',
                borderRadius: '16px',
                padding: '12px 24px',
                textAlign: 'center',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '15px',
                fontWeight: 600,
                color: '#92400E'
              }}>
                👉 Cú Bo Bo sẽ đọc từ tiếng Anh. Bé hãy lắng nghe và chọn đúng hình ảnh bên dưới nhé! (Đã đúng: {listenSuccessCount}/5)
              </div>

              {/* Loa phát âm */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                border: '3px solid #F59E0B',
                padding: '24px 36px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                boxShadow: '0 6px 0 #D97706'
              }}>
                <button
                  onClick={handleReplayVoice}
                  className="animate-pulse-glow"
                  style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: '50%',
                    backgroundColor: '#F59E0B',
                    border: 'none',
                    fontSize: '36px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 0 #D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Bấm để nghe lại phát âm"
                >
                  🔊
                </button>
                <div>
                  <div style={{ fontSize: '13px', color: '#92400E', fontWeight: 700 }}>
                    Bấm loa để nghe phát âm:
                  </div>
                  <div style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '26px', fontWeight: 800, color: '#1E293B' }}>
                    "{targetWord.word}"
                  </div>
                </div>
              </div>

              {/* 4 Lựa chọn hình ảnh */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                width: '100%',
                maxWidth: '600px'
              }}>
                {listenOptions.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => handleAnswerListen(opt)}
                    className="card-kid"
                    style={{
                      padding: '12px',
                      borderRadius: '20px',
                      backgroundColor: '#FFFFFF',
                      border: '3px solid #E2E8F0',
                      cursor: 'pointer',
                      boxShadow: '0 6px 0 #E2E8F0',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <img
                      src={opt.image}
                      alt={opt.word}
                      style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '14px', marginBottom: '10px' }}
                    />
                    <div style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '20px', fontWeight: 800, color: '#334155' }}>
                      {opt.meaning}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
