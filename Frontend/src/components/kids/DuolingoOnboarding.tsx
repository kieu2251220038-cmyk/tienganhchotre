import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sounds, speakEnglish } from '../../utils/soundEffects';
import { authService } from '../../services/authService';
import { userDataService } from '../../services/userDataService';

// ================= TYPES & INTERFACES =================
export interface LearningGoal {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  badge?: string;
}

export interface DailyGoalOption {
  minutes: number;
  label: string;
  subLabel: string;
  badgeColor: string;
}

export interface PlacementQuestion {
  id: number;
  promptVi: string;
  promptEn: string;
  speakText: string;
  image: string;
  options: {
    text: string;
    subText: string;
    emoji: string;
    isCorrect: boolean;
  }[];
}

// 5 Mục tiêu học tập phong cách Duolingo
const LEARNING_GOALS: LearningGoal[] = [
  {
    id: 'grade_1',
    emoji: '🎓',
    title: 'Chuẩn bị vào lớp 1 & Đạt điểm cao',
    desc: 'Xây nền tảng phát âm bảng chữ cái A-B-C và từ vựng trường lớp chuẩn quốc tế.',
    badge: 'Phổ biến nhất'
  },
  {
    id: 'cartoons',
    emoji: '🎬',
    title: 'Xem phim hoạt hình & Nghe nhạc thiếu nhi',
    desc: 'Hiểu trọn vẹn Peppa Pig, Frozen, Disney mà không cần ba mẹ dịch nghĩa.',
    badge: 'Bé yêu thích'
  },
  {
    id: 'brain_power',
    emoji: '🧠',
    title: 'Kích thích trí tuệ & Tư duy ngôn ngữ',
    desc: 'Kích hoạt vùng não ngôn ngữ trong "giai đoạn vàng" 3 – 8 tuổi của bé.',
    badge: 'Chuyên gia khuyên'
  },
  {
    id: 'confidence',
    emoji: '🌍',
    title: 'Tự tin kết bạn & Giao tiếp quốc tế',
    desc: 'Nói tiếng Anh tự nhiên, phản xạ nhanh và dạn dĩ khi gặp người nước ngoài.'
  },
  {
    id: 'play_and_learn',
    emoji: '🎮',
    title: 'Vừa chơi vừa học, khám phá thế giới',
    desc: 'Học vui nhộn qua flashcard, minigame, tích lũy sao mở rương kho báu.'
  }
];

// Cam kết thời gian hàng ngày
const DAILY_GOALS: DailyGoalOption[] = [
  { minutes: 5, label: '5 phút / ngày', subLabel: 'Dễ dàng (Khởi động nhẹ nhàng)', badgeColor: '#10B981' },
  { minutes: 10, label: '10 phút / ngày', subLabel: 'Vừa sức (Được khuyên dùng ⭐)', badgeColor: '#3B82F6' },
  { minutes: 15, label: '15 phút / ngày', subLabel: 'Chăm chỉ (Tiến bộ vượt trội)', badgeColor: '#F59E0B' },
  { minutes: 20, label: '20 phút / ngày', subLabel: 'Siêu nhí (Bứt phá thần tốc)', badgeColor: '#EF4444' }
];

// 4 Câu hỏi bài mồi sinh động
const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  {
    id: 1,
    promptVi: 'Quả táo này có màu gì nào bé ơi?',
    promptEn: 'What color is this apple? 🍎',
    speakText: 'What color is this apple? Red!',
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop',
    options: [
      { text: 'Red', subText: 'Màu đỏ', emoji: '🍎', isCorrect: true },
      { text: 'Blue', subText: 'Màu xanh dương', emoji: '🫐', isCorrect: false },
      { text: 'Yellow', subText: 'Màu vàng', emoji: '🍋', isCorrect: false }
    ]
  },
  {
    id: 2,
    promptVi: 'Con vật nào kêu "Meow... meow" đáng yêu nhỉ?',
    promptEn: 'Which animal says "Meow meow"? 🐱',
    speakText: 'Which animal says meow? It is a cat!',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop',
    options: [
      { text: 'Dog', subText: 'Chú cún con', emoji: '🐶', isCorrect: false },
      { text: 'Cat', subText: 'Chú mèo con', emoji: '🐱', isCorrect: true },
      { text: 'Duck', subText: 'Chú vịt con', emoji: '🦆', isCorrect: false }
    ]
  },
  {
    id: 3,
    promptVi: 'Bé đếm xem có bao nhiêu ngôi sao tỏa sáng?',
    promptEn: 'How many stars are there? ⭐⭐⭐',
    speakText: 'How many stars are there? One, two, three stars!',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop',
    options: [
      { text: '2 stars', subText: '2 ngôi sao', emoji: '⭐⭐', isCorrect: false },
      { text: '3 stars', subText: '3 ngôi sao', emoji: '⭐⭐⭐', isCorrect: true },
      { text: '5 stars', subText: '5 ngôi sao', emoji: '⭐⭐⭐⭐⭐', isCorrect: false }
    ]
  },
  {
    id: 4,
    promptVi: 'Khi gặp thầy cô và bạn bè, bé chào câu gì?',
    promptEn: 'When you meet a friend, what do you say? 👋',
    speakText: 'When you meet a friend, what do you say? Hello! How are you?',
    image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&auto=format&fit=crop',
    options: [
      { text: 'Hello! How are you?', subText: 'Xin chào! Bạn có khỏe không?', emoji: '👋', isCorrect: true },
      { text: 'Good night!', subText: 'Chúc ngủ ngon!', emoji: '🌙', isCorrect: false },
      { text: 'Thank you, apple!', subText: 'Cảm ơn quả táo!', emoji: '🍏', isCorrect: false }
    ]
  }
];

export default function DuolingoOnboarding() {
  const navigate = useNavigate();

  // Các bước: GOALS -> PLACEMENT_TEST -> RESULT -> CREATE_PROFILE -> SUCCESS
  const [step, setStep] = useState<'GOALS' | 'PLACEMENT_TEST' | 'RESULT' | 'CREATE_PROFILE' | 'SUCCESS'>('GOALS');

  // Step 1: Mục tiêu
  const [selectedGoal, setSelectedGoal] = useState<string>('grade_1');
  const [dailyMinutes, setDailyMinutes] = useState<number>(10);

  // Step 2: Bài mồi test
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  // Step 3: Tạo hồ sơ bé
  const [childAge, setChildAge] = useState<string>('5');
  const [displayName, setDisplayName] = useState<string>('Bé Bắp');
  const [username, setUsername] = useState<string>('bebap2026');
  const [password, setPassword] = useState<string>('123456');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Level khuyến nghị sau bài test
  const [recommendedLevel, setRecommendedLevel] = useState<{
    age: string;
    title: string;
    desc: string;
    badgeEmoji: string;
  }>({
    age: '5',
    title: 'Bậc 3: Tự Tin Giao Tiếp (5 Tuổi)',
    desc: 'Bé nhận biết từ vựng rất tốt! Bé sẽ làm quen gia đình, bạn bè, trường lớp và câu ngắn!',
    badgeEmoji: '🐼'
  });

  // ================= XỬ LÝ STEP 1: CHỌN MỤC TIÊU =================
  const handleProceedToTest = () => {
    sounds.playClick();
    setStep('PLACEMENT_TEST');
    setCurrentQIndex(0);
    setSelectedOptionIndex(null);
    setIsChecked(false);
    setScore(0);
    // Tự động phát âm câu hỏi 1
    setTimeout(() => {
      speakEnglish(PLACEMENT_QUESTIONS[0].speakText);
    }, 400);
  };

  // ================= XỬ LÝ STEP 2: BÀI MỒI TEST =================
  const currentQ = PLACEMENT_QUESTIONS[currentQIndex];

  const handleSelectOption = (idx: number) => {
    if (isChecked) return;
    sounds.playClick();
    setSelectedOptionIndex(idx);
    // Phát âm từ vựng tương ứng
    speakEnglish(currentQ.options[idx].text);
  };

  const handleCheckAnswer = () => {
    if (selectedOptionIndex === null) return;
    setIsChecked(true);
    const isCorrect = currentQ.options[selectedOptionIndex].isCorrect;

    if (isCorrect) {
      sounds.playCorrect();
      setScore(prev => prev + 1);
    } else {
      sounds.playWrong();
    }
  };

  const handleNextQuestion = () => {
    sounds.playClick();
    if (currentQIndex + 1 < PLACEMENT_QUESTIONS.length) {
      const nextIdx = currentQIndex + 1;
      setCurrentQIndex(nextIdx);
      setSelectedOptionIndex(null);
      setIsChecked(false);
      setTimeout(() => {
        speakEnglish(PLACEMENT_QUESTIONS[nextIdx].speakText);
      }, 300);
    } else {
      // Kết thúc bài test, tính điểm và xếp lớp
      const finalScore = score + (selectedOptionIndex !== null && currentQ.options[selectedOptionIndex].isCorrect ? 1 : 0);
      sounds.playVictory();

      let recAge = '3';
      let recTitle = 'Bậc 1: Khám Phá Mầm Non (3 - 4 Tuổi)';
      let recDesc = 'Bé sẽ bắt đầu với Bảng chữ cái A-B-C, thế giới sắc màu và những bài hát vui nhộn!';
      let recEmoji = '🐣';

      if (finalScore >= 4) {
        recAge = '7';
        recTitle = 'Bậc 5: Siêu Nhí Khám Phá (7 - 8 Tuổi)';
        recDesc = 'Bé có phản xạ tiếng Anh rất tuyệt vời! Bé sẽ học câu giao tiếp, đọc hiểu và khám phá thế giới!';
        recEmoji = '🦁';
      } else if (finalScore >= 2) {
        recAge = '5';
        recTitle = 'Bậc 3: Tự Tin Giao Tiếp (5 - 6 Tuổi)';
        recDesc = 'Bé nhận biết rất nhanh các đồ vật xung quanh! Bé sẽ học gia đình, số đếm và câu ngắn!';
        recEmoji = '🐼';
      }

      setChildAge(recAge);
      setRecommendedLevel({
        age: recAge,
        title: recTitle,
        desc: recDesc,
        badgeEmoji: recEmoji
      });

      // Tự động sinh username gợi ý
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setUsername(`be${recAge}_${randomSuffix}`);

      setStep('RESULT');
    }
  };

  // ================= XỬ LÝ STEP 3: TẠO HỒ SƠ & BẮT ĐẦU =================
  const handleCreateProfileAndLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setErrorMsg('');

    if (!displayName.trim()) {
      setErrorMsg('Vui lòng nhập tên gọi thân mật của bé!');
      return;
    }
    if (!username.trim() || username.length < 3) {
      setErrorMsg('Tên đăng nhập cần có ít nhất 3 ký tự!');
      return;
    }
    if (!password.trim() || password.length < 4) {
      setErrorMsg('Mật khẩu cần ít nhất 4 ký tự để an toàn!');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Đăng ký tài khoản người dùng vào Backend MySQL
      await authService.register(
        username.trim(),
        password.trim(),
        displayName.trim(),
        childAge,
        dailyMinutes
      );

      // 2. Lưu trạng thái onboarding và bậc mở khóa trên Backend
      const ageNum = Math.max(3, Math.min(8, Number(childAge) || 3));
      await userDataService.updatePreferences({
        onboarding_completed: true,
        unlocked_age: ageNum
      });

      // 3. Âm thanh chiến thắng & chuyển sang bước thành công
      sounds.playVictory();
      setStep('SUCCESS');

      // 4. Chuyển thẳng vào Dashboard sau 1 giây hiệu ứng
      setTimeout(() => {
        navigate('/dashboard');
      }, 1200);
    } catch (err: unknown) {
      sounds.playWrong();
      setErrorMsg((err as Error).message || 'Tên đăng nhập đã có người sử dụng. Bé hãy thử tên khác nhé!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Progress Bar calculation
  const progressPercent = step === 'GOALS' ? 15 : step === 'PLACEMENT_TEST' ? 20 + ((currentQIndex + 1) / PLACEMENT_QUESTIONS.length) * 60 : 100;

  return (
    <div style={{
      maxWidth: '880px',
      margin: '0 auto',
      backgroundColor: '#FFFFFF',
      borderRadius: '32px',
      border: '3px solid #E5E5E5',
      boxShadow: '0 12px 0 #E2E8F0',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* ================= DUOLINGO HEADER BAR ================= */}
      <div style={{
        padding: '18px 28px',
        borderBottom: '2px solid #F1F5F9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        backgroundColor: '#FFFFFF'
      }}>
        {/* Back / Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '32px' }}>🦉</span>
          <div>
            <div style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '20px',
              fontWeight: 800,
              color: '#58CC02',
              lineHeight: 1.1
            }}>
              Kids English
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700 }}>
              Khảo sát & Xếp lớp vui vẻ
            </div>
          </div>
        </div>

        {/* Green Progress Bar */}
        <div style={{
          flex: 1,
          maxWidth: '360px',
          height: '16px',
          backgroundColor: '#E5E5E5',
          borderRadius: '999px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            height: '100%',
            width: `${progressPercent}%`,
            backgroundColor: '#58CC02',
            borderRadius: '999px',
            transition: 'width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }} />
        </div>

        {/* Login Button for Existing Users */}
        <button
          onClick={() => { sounds.playClick(); navigate('/login'); }}
          style={{
            backgroundColor: '#FFFFFF',
            border: '2px solid #E5E5E5',
            borderRadius: '14px',
            padding: '8px 16px',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '13px',
            fontWeight: 700,
            color: '#1CB0F6',
            cursor: 'pointer',
            boxShadow: '0 2px 0 #E5E5E5'
          }}
        >
          🔑 Tôi đã có tài khoản
        </button>
      </div>

      {/* ================= STEP 1: BẠN MUỐN HỌC TIẾNG ANH ĐỂ LÀM GÌ? ================= */}
      {step === 'GOALS' && (
        <div style={{ padding: '36px 32px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Mascot Greeting */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ fontSize: '64px', lineHeight: 1 }} className="animate-bounce">
              🦉
            </div>
            <div style={{
              backgroundColor: '#F7FEE7',
              border: '2.5px solid #84CC16',
              borderRadius: '20px',
              padding: '16px 22px',
              position: 'relative',
              boxShadow: '0 4px 0 #65A30D'
            }}>
              <h2 style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '22px',
                fontWeight: 800,
                color: '#365314',
                margin: '0 0 6px 0'
              }}>
                Chào bé yêu và ba mẹ! Bạn muốn học tiếng Anh để làm gì nào? ✨
              </h2>
              <p style={{ margin: 0, fontSize: '15px', color: '#4D7C0F', fontWeight: 600 }}>
                Hãy chọn mục tiêu lớn nhất để Cú Xanh thiết kế bài mồi và lộ trình phù hợp nhất cho bé nhé!
              </p>
            </div>
          </div>

          {/* Goal Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {LEARNING_GOALS.map((goal) => {
              const isSelected = selectedGoal === goal.id;
              return (
                <div
                  key={goal.id}
                  onClick={() => { sounds.playClick(); setSelectedGoal(goal.id); }}
                  style={{
                    backgroundColor: isSelected ? '#F0FDF4' : '#FFFFFF',
                    border: isSelected ? '3px solid #58CC02' : '2.5px solid #E5E5E5',
                    borderRadius: '20px',
                    padding: '18px',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 6px 0 #46A302' : '0 4px 0 #E2E8F0',
                    transform: isSelected ? 'translateY(-2px)' : 'none',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '125px'
                  }}
                >
                  {goal.badge && (
                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      backgroundColor: isSelected ? '#58CC02' : '#F1F5F9',
                      color: isSelected ? '#FFFFFF' : '#64748B',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '999px'
                    }}>
                      {goal.badge}
                    </span>
                  )}
                  <div>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>{goal.emoji}</div>
                    <div style={{
                      fontFamily: 'Fredoka, sans-serif',
                      fontSize: '16px',
                      fontWeight: 800,
                      color: isSelected ? '#15803D' : '#1E293B',
                      marginBottom: '4px'
                    }}>
                      {goal.title}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.4, fontWeight: 500 }}>
                      {goal.desc}
                    </div>
                  </div>
                  {isSelected && (
                    <div style={{ marginTop: '10px', fontSize: '13px', fontWeight: 800, color: '#16A34A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>✓</span> Đã chọn mục tiêu này
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Daily Goal Commitment */}
          <div style={{
            backgroundColor: '#F8FAFC',
            border: '2px solid #E2E8F0',
            borderRadius: '20px',
            padding: '20px 24px'
          }}>
            <div style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '17px',
              fontWeight: 800,
              color: '#0F172A',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⏱️</span> Mục tiêu luyện tập mỗi ngày của bé:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              {DAILY_GOALS.map((dg) => {
                const isSelected = dailyMinutes === dg.minutes;
                return (
                  <button
                    key={dg.minutes}
                    type="button"
                    onClick={() => { sounds.playClick(); setDailyMinutes(dg.minutes); }}
                    style={{
                      backgroundColor: isSelected ? '#FFFFFF' : '#F1F5F9',
                      border: isSelected ? `2.5px solid ${dg.badgeColor}` : '2px solid #CBD5E1',
                      borderRadius: '16px',
                      padding: '12px 14px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      boxShadow: isSelected ? `0 4px 0 ${dg.badgeColor}` : 'none'
                    }}
                  >
                    <div style={{
                      fontFamily: 'Fredoka, sans-serif',
                      fontSize: '15px',
                      fontWeight: 800,
                      color: isSelected ? dg.badgeColor : '#334155'
                    }}>
                      {dg.label}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', fontWeight: 600 }}>
                      {dg.subLabel}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Button */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
            <button
              onClick={handleProceedToTest}
              style={{
                backgroundColor: '#58CC02',
                color: '#FFFFFF',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '19px',
                fontWeight: 800,
                padding: '16px 48px',
                borderRadius: '18px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 6px 0 #46A302',
                transition: 'all 0.1s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <span>BẮT ĐẦU BÀI MỒI KHẢO SÁT (+20 ⭐)</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: BÀI MỒI THỬ THÁCH (4 CÂU HỎI) ================= */}
      {step === 'PLACEMENT_TEST' && (
        <div style={{ padding: '32px 32px 100px 32px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Header question status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '14px',
              fontWeight: 800,
              color: '#0284C7',
              backgroundColor: '#E0F2FE',
              padding: '6px 14px',
              borderRadius: '999px',
              border: '1.5px solid #BAE6FD'
            }}>
              🎯 Câu hỏi {currentQIndex + 1} / {PLACEMENT_QUESTIONS.length}
            </span>

            <button
              type="button"
              onClick={() => speakEnglish(currentQ.speakText)}
              style={{
                backgroundColor: '#FEF08A',
                border: '2px solid #EAB308',
                borderRadius: '999px',
                padding: '6px 16px',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '13px',
                fontWeight: 800,
                color: '#854D0E',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 0 #CA8A04'
              }}
            >
              <span>🔊</span>
              <span>Nghe giọng đọc bản ngữ</span>
            </button>
          </div>

          {/* Question Prompt */}
          <div>
            <h2 style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '26px',
              fontWeight: 800,
              color: '#0F172A',
              margin: '0 0 6px 0',
              lineHeight: 1.25
            }}>
              {currentQ.promptVi}
            </h2>
            <div style={{
              fontSize: '18px',
              color: '#2563EB',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>{currentQ.promptEn}</span>
            </div>
          </div>

          {/* Question Image */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#F8FAFC',
            borderRadius: '24px',
            border: '2px solid #E2E8F0',
            padding: '16px',
            maxHeight: '260px',
            overflow: 'hidden'
          }}>
            <img
              src={currentQ.image}
              alt="Illustration"
              style={{
                maxHeight: '220px',
                width: 'auto',
                maxWidth: '100%',
                objectFit: 'cover',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}
            />
          </div>

          {/* Options Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOptionIndex === idx;
              let borderStyle = '2.5px solid #E5E5E5';
              let bgStyle = '#FFFFFF';
              let shadowStyle = '0 4px 0 #CBD5E1';

              if (isChecked) {
                if (opt.isCorrect) {
                  borderStyle = '3px solid #58CC02';
                  bgStyle = '#DCFCE7';
                  shadowStyle = '0 4px 0 #16A34A';
                } else if (isSelected && !opt.isCorrect) {
                  borderStyle = '3px solid #EF4444';
                  bgStyle = '#FEE2E2';
                  shadowStyle = '0 4px 0 #DC2626';
                }
              } else if (isSelected) {
                borderStyle = '3px solid #1CB0F6';
                bgStyle = '#F0F9FF';
                shadowStyle = '0 5px 0 #0284C7';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(idx)}
                  disabled={isChecked}
                  style={{
                    backgroundColor: bgStyle,
                    border: borderStyle,
                    borderRadius: '20px',
                    padding: '18px 16px',
                    cursor: isChecked ? 'default' : 'pointer',
                    boxShadow: shadowStyle,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '34px', lineHeight: 1 }}>{opt.emoji}</span>
                  <div>
                    <div style={{
                      fontFamily: 'Fredoka, sans-serif',
                      fontSize: '18px',
                      fontWeight: 800,
                      color: '#0F172A'
                    }}>
                      {opt.text}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
                      {opt.subText}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ================= DUOLINGO BOTTOM ACTION BAR ================= */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '18px 32px',
            backgroundColor: !isChecked
              ? '#FFFFFF'
              : currentQ.options[selectedOptionIndex || 0]?.isCorrect
                ? '#D7FFB8'
                : '#FFDFE0',
            borderTop: !isChecked
              ? '2px solid #E5E5E5'
              : currentQ.options[selectedOptionIndex || 0]?.isCorrect
                ? '2px solid #58CC02'
                : '2px solid #EA2B2B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            zIndex: 10
          }}>
            {!isChecked ? (
              <>
                <div style={{ fontSize: '14px', color: '#64748B', fontWeight: 600 }}>
                  👉 Bé hãy chọn đáp án bé nghĩ là đúng nhất nhé!
                </div>
                <button
                  onClick={handleCheckAnswer}
                  disabled={selectedOptionIndex === null}
                  style={{
                    backgroundColor: selectedOptionIndex !== null ? '#58CC02' : '#E5E5E5',
                    color: selectedOptionIndex !== null ? '#FFFFFF' : '#AFAFAF',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: '17px',
                    fontWeight: 800,
                    padding: '14px 40px',
                    borderRadius: '16px',
                    border: 'none',
                    cursor: selectedOptionIndex !== null ? 'pointer' : 'not-allowed',
                    boxShadow: selectedOptionIndex !== null ? '0 5px 0 #46A302' : 'none'
                  }}
                >
                  KIỂM TRA ĐÁP ÁN
                </button>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '36px' }}>
                    {currentQ.options[selectedOptionIndex || 0]?.isCorrect ? '🎉' : '💡'}
                  </span>
                  <div>
                    <div style={{
                      fontFamily: 'Fredoka, sans-serif',
                      fontSize: '20px',
                      fontWeight: 800,
                      color: currentQ.options[selectedOptionIndex || 0]?.isCorrect ? '#2B8200' : '#EA2B2B'
                    }}>
                      {currentQ.options[selectedOptionIndex || 0]?.isCorrect
                        ? 'Chính xác 100%! Bé xuất sắc quá!'
                        : `Cố lên bé ơi! Đáp án đúng là: ${currentQ.options.find(o => o.isCorrect)?.text}`}
                    </div>
                    <div style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>
                      {currentQ.options[selectedOptionIndex || 0]?.isCorrect
                        ? '+10 điểm phản xạ tiếng Anh bản xứ'
                        : 'Không sao cả, bé sẽ được luyện tập lại trong bài học nhé!'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleNextQuestion}
                  style={{
                    backgroundColor: currentQ.options[selectedOptionIndex || 0]?.isCorrect ? '#58CC02' : '#EA2B2B',
                    color: '#FFFFFF',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: '17px',
                    fontWeight: 800,
                    padding: '14px 38px',
                    borderRadius: '16px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: currentQ.options[selectedOptionIndex || 0]?.isCorrect ? '0 5px 0 #46A302' : '0 5px 0 #B91C1C'
                  }}
                >
                  {currentQIndex + 1 < PLACEMENT_QUESTIONS.length ? 'TIẾP TỤC ➔' : 'XEM KẾT QUẢ XẾP LỚP 🏆'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= STEP 3: KẾT QUẢ BÀI TEST & VINH DANH ================= */}
      {step === 'RESULT' && (
        <div style={{
          padding: '40px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '24px'
        }}>
          <div style={{ fontSize: '80px', lineHeight: 1 }} className="animate-bounce">
            🏆
          </div>

          <div>
            <h2 style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '32px',
              fontWeight: 800,
              color: '#15803D',
              margin: '0 0 8px 0'
            }}>
              Hoan Hô Bé Đã Hoàn Thành Bài Mồi Xuất Sắc! 🎉
            </h2>
            <p style={{ fontSize: '16px', color: '#475569', maxWidth: '600px', margin: '0 auto', fontWeight: 600 }}>
              Bé đã trả lời đúng <strong style={{ color: '#16A34A', fontSize: '18px' }}>{score} / {PLACEMENT_QUESTIONS.length}</strong> câu hỏi tiếng Anh!
            </p>
          </div>

          {/* Reward Badges */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '16px',
            backgroundColor: '#FEF9C3',
            border: '2.5px solid #FDE047',
            padding: '12px 28px',
            borderRadius: '999px',
            boxShadow: '0 4px 0 #EAB308'
          }}>
            <span style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 800, color: '#A16207', fontSize: '16px' }}>
              ⭐ +20 Ngôi Sao Thưởng
            </span>
            <span style={{ color: '#CA8A04' }}>•</span>
            <span style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 800, color: '#2563EB', fontSize: '16px' }}>
              🪙 +50 Đồng Xu Thần Kỳ
            </span>
          </div>

          {/* Recommended Level Card */}
          <div style={{
            backgroundColor: '#F0FDF4',
            border: '2.5px solid #86EFAC',
            borderRadius: '24px',
            padding: '24px 28px',
            maxWidth: '580px',
            width: '100%',
            textAlign: 'left',
            boxShadow: '0 6px 0 #BBF7D0'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 800,
              color: '#166534',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '6px'
            }}>
              ✨ CẤP ĐỘ HỌC ĐƯỢC CHUYÊN GIA ĐỀ XUẤT CHO BÉ:
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '24px',
              fontWeight: 800,
              color: '#15803D'
            }}>
              <span>{recommendedLevel.badgeEmoji}</span>
              <span>{recommendedLevel.title}</span>
            </div>
            <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.55, margin: '10px 0 0 0', fontWeight: 500 }}>
              {recommendedLevel.desc}
            </p>
          </div>

          {/* Button to proceed to create profile */}
          <button
            onClick={() => { sounds.playClick(); setStep('CREATE_PROFILE'); }}
            style={{
              backgroundColor: '#58CC02',
              color: '#FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '19px',
              fontWeight: 800,
              padding: '16px 44px',
              borderRadius: '18px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 6px 0 #46A302',
              marginTop: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <span>TẠO HỒ SƠ & BƯỚC VÀO LỘ TRÌNH HỌC</span>
            <span>➔</span>
          </button>
        </div>
      )}

      {/* ================= STEP 4: TẠO HỒ SƠ HỌC CHO BÉ (DUOLINGO PROFILE CREATION) ================= */}
      {step === 'CREATE_PROFILE' && (
        <div style={{ padding: '36px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>👧👦✨</div>
            <h2 style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '28px',
              fontWeight: 800,
              color: '#0F172A',
              margin: '0 0 6px 0'
            }}>
              Tạo Hồ Sơ Học Cho Bé
            </h2>
            <p style={{ fontSize: '15px', color: '#64748B', fontWeight: 600 }}>
              Chỉ 1 phút tạo tài khoản để lưu lại chuỗi ngày học streak, nhận cúp vàng và mở rương báu!
            </p>
          </div>

          {errorMsg && (
            <div style={{
              backgroundColor: '#FEE2E2',
              border: '2px solid #FCA5A5',
              borderRadius: '16px',
              padding: '12px 18px',
              color: '#B91C1C',
              fontSize: '14px',
              fontWeight: 700,
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleCreateProfileAndLaunch} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* 1. Chọn độ tuổi của bé */}
            <div>
              <label style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '15px',
                fontWeight: 800,
                color: '#1E293B',
                display: 'block',
                marginBottom: '10px'
              }}>
                🎂 1. Bé bao nhiêu tuổi? (Chọn đúng tuổi để hệ thống cá nhân hóa bài học):
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                {[
                  { age: '3', label: '3 Tuổi', emoji: '🐣' },
                  { age: '4', label: '4 Tuổi', emoji: '🐥' },
                  { age: '5', label: '5 Tuổi', emoji: '🐼' },
                  { age: '6', label: '6 Tuổi', emoji: '🦊' },
                  { age: '7', label: '7 Tuổi', emoji: '🦁' },
                  { age: '8', label: '8 Tuổi', emoji: '🚀' }
                ].map((item) => {
                  const isSelected = childAge === item.age;
                  return (
                    <button
                      key={item.age}
                      type="button"
                      onClick={() => { sounds.playClick(); setChildAge(item.age); }}
                      style={{
                        backgroundColor: isSelected ? '#EFF6FF' : '#F8FAFC',
                        border: isSelected ? '3px solid #3B82F6' : '2px solid #E2E8F0',
                        borderRadius: '16px',
                        padding: '12px 6px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 4px 0 #2563EB' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontSize: '24px' }}>{item.emoji}</div>
                      <div style={{
                        fontFamily: 'Fredoka, sans-serif',
                        fontSize: '14px',
                        fontWeight: 800,
                        color: isSelected ? '#1D4ED8' : '#334155',
                        marginTop: '4px'
                      }}>
                        {item.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Tên gọi thân mật của bé */}
            <div>
              <label style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '15px',
                fontWeight: 800,
                color: '#1E293B',
                display: 'block',
                marginBottom: '6px'
              }}>
                ⭐ 2. Tên gọi thân mật của bé:
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => {
                  const val = e.target.value;
                  setDisplayName(val);
                  // Tự động gợi ý username
                  if (val.trim()) {
                    const clean = val.toLowerCase().replace(/[^a-z0-9]/g, '');
                    setUsername(`${clean || 'be'}${childAge}_${Math.floor(100 + Math.random() * 900)}`);
                  }
                }}
                placeholder="Ví dụ: Bé Bắp, An Nhiên, Minh Khang..."
                required
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  borderRadius: '16px',
                  border: '2.5px solid #CBD5E1',
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#0F172A',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* 3. Tên đăng nhập & Mật khẩu */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#1E293B',
                  display: 'block',
                  marginBottom: '6px'
                }}>
                  👤 3. Tên đăng nhập (Username):
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ví dụ: bebap2026"
                  required
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '16px',
                    border: '2.5px solid #CBD5E1',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#0F172A',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#1E293B',
                  display: 'block',
                  marginBottom: '6px'
                }}>
                  🔒 4. Mật khẩu (Dễ nhớ cho bé):
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ví dụ: 123456"
                  required
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '16px',
                    border: '2.5px solid #CBD5E1',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#0F172A',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  backgroundColor: '#58CC02',
                  color: '#FFFFFF',
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: '19px',
                  fontWeight: 800,
                  padding: '16px 52px',
                  borderRadius: '18px',
                  border: 'none',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 0 #46A302',
                  opacity: isSubmitting ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <span>{isSubmitting ? 'ĐANG TẠO HỒ SƠ... ⏳' : '🎉 HOÀN TẤT HỒ SƠ & VÀO HỌC NGAY!'}</span>
                {!isSubmitting && <span>➔</span>}
              </button>

              <button
                type="button"
                onClick={() => { sounds.playClick(); navigate('/login'); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1CB0F6',
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Bé hoặc ba mẹ đã có tài khoản rồi? Bấm vào đây để đăng nhập
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= STEP 5: HOÀN TẤT & CHUYỂN HƯỚNG ================= */}
      {step === 'SUCCESS' && (
        <div style={{
          padding: '60px 32px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{ fontSize: '80px' }} className="animate-bounce">
            🚀
          </div>
          <h2 style={{
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '32px',
            fontWeight: 800,
            color: '#15803D',
            margin: 0
          }}>
            Chào mừng bé {displayName}! 🎉
          </h2>
          <p style={{ fontSize: '18px', color: '#475569', fontWeight: 600 }}>
            Hệ thống đã chuẩn bị lộ trình học Duolingo Bậc {childAge} Tuổi riêng cho bé. Đang chuyển vào lớp học...
          </p>
          <div style={{
            width: '60px',
            height: '60px',
            border: '6px solid #DCFCE7',
            borderTop: '6px solid #58CC02',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      )}
    </div>
  );
}
