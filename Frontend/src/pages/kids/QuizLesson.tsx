import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService } from '../../services/courseService';
import { progressService, type LessonRewardResult } from '../../services/progressService';
import { authService } from '../../services/authService';
import type { Question, Answer } from '../../types';
import { speakEnglish, sounds } from '../../utils/soundEffects';
import { getVocabularyFallbackImage } from '../../utils/vocabularyVisuals';
import RewardPopup from '../../components/RewardPopup';
import FireworksCelebration from '../../components/FireworksCelebration';

const isCorrectAnswer = (answer: Answer) => answer.is_correct === true || Number(answer.is_correct) === 1;

const shuffleAnswers = (answers: Answer[] = []): Answer[] => {
  const shuffled = [...answers];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};

const shuffleQuestionAnswers = (question: Question): Question => ({
  ...question,
  answers: shuffleAnswers(question.answers)
});

export default function QuizLesson() {
  const { lessonId = '3' } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [originalQuestions, setOriginalQuestions] = useState<Question[]>([]);
  const [retryQuestionIds, setRetryQuestionIds] = useState<Record<number, boolean>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<Answer | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [wrongAnswerWasRetry, setWrongAnswerWasRetry] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [reward, setReward] = useState<LessonRewardResult | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationKey, setCelebrationKey] = useState(0);

  useEffect(() => {
    courseService.getLessonDetail(Number(lessonId)).then((res) => {
      if (res.questions && res.questions.length > 0) {
        setQuestions(res.questions.map(shuffleQuestionAnswers));
        setOriginalQuestions(res.questions);
        setCurrentIndex(0);
        setRetryQuestionIds({});
      }
    });
  }, [lessonId]);

  const currentQ = questions[currentIndex] || {
    question_text: 'Where is the Cat? 🐱',
    points: 10,
    answers: [
      { id: 1, answer_text: 'Cat', media_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&auto=format&fit=crop', is_correct: true },
      { id: 2, answer_text: 'Dog', media_url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop', is_correct: false },
      { id: 3, answer_text: 'Bird', media_url: 'https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?w=500&auto=format&fit=crop', is_correct: false },
      { id: 4, answer_text: 'Elephant', media_url: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=500&auto=format&fit=crop', is_correct: false }
    ]
  };

  const handlePronounceQuestion = () => {
    sounds.playClick();
    speakEnglish(currentQ.question_text.replace(/[^\w\s]/gi, ''));
  };

  const handleSelectAnswer = (ans: Answer) => {
    if (isAnswered) return;
    setSelectedAnswer(ans);
    setIsAnswered(true);
    setWrongAnswerWasRetry(false);

    if (isCorrectAnswer(ans)) {
      sounds.playCorrect();
      setCelebrationKey((key) => key + 1);
      setShowCelebration(true);
      setScore((prev) => prev + (currentQ.points || 10));
    } else {
      sounds.playWrong();
      const questionKey = currentQ.id || -1;
      const alreadyRetried = Boolean(retryQuestionIds[questionKey]);
      setWrongAnswerWasRetry(alreadyRetried);

      // Đưa câu sai vào cuối lượt hiện tại đúng một lần để bé được ôn lại.
      if (!alreadyRetried) {
        setRetryQuestionIds((previous) => ({ ...previous, [questionKey]: true }));
        setQuestions((previous) => [...previous, shuffleQuestionAnswers(currentQ)]);
      }
    }
  };

  const handleNextQuestion = () => {
    sounds.playClick();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setWrongAnswerWasRetry(false);
    } else {
      setIsFinished(true);
      const user = authService.getCurrentUser();
      progressService.completeLesson(user.id, Number(lessonId), score, 3).then((r) => {
        if (r) setReward(r);
      });
    }
  };

  const handleRestart = () => {
    sounds.playClick();
    setCurrentIndex(0);
    setQuestions(originalQuestions.map(shuffleQuestionAnswers));
    setRetryQuestionIds({});
    setSelectedAnswer(null);
    setIsAnswered(false);
    setWrongAnswerWasRetry(false);
    setScore(0);
    setIsFinished(false);
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '26px' }}>
      <FireworksCelebration
        visible={showCelebration}
        eventKey={celebrationKey}
        onDone={() => setShowCelebration(false)}
      />
      {/* Reward Popup */}
      {reward && (
        <RewardPopup
          reward={reward}
          lessonTitle="Quiz Trắc Nghiệm"
          onContinue={() => { setReward(null); navigate('/dashboard'); }}
          onClose={() => setReward(null)}
        />
      )}
      {/* Top Header & Progress */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: '16px 24px',
        borderRadius: '20px',
        border: '2px solid #E2E8F0',
        boxShadow: '0 4px 0 #E2E8F0'
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-kid btn-outline"
          style={{ padding: '8px 16px', fontSize: '14px' }}
        >
          ← Trở Về
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>
            🎯 Trắc Nghiệm Đố Vui
          </div>
          <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
            Câu {currentIndex + 1} / {questions.length || 3}
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: 'Fredoka, sans-serif',
          fontWeight: 700,
          color: '#CA8A04',
          fontSize: '16px',
          backgroundColor: '#FEF9C3',
          padding: '6px 14px',
          borderRadius: '999px',
          border: '1.5px solid #FDE047'
        }}>
          <span>⭐</span>
          <span>{score} Điểm</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ height: '12px', backgroundColor: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{
          width: `${((currentIndex + 1) / (questions.length || 3)) * 100}%`,
          height: '100%',
          backgroundColor: '#3B82F6',
          transition: 'width 0.3s ease'
        }}></div>
      </div>

      {/* Finished Screen */}
      {isFinished ? (
        <div className="card-kid animate-celebrate" style={{
          textAlign: 'center',
          padding: '48px 24px',
          backgroundColor: '#EFF6FF',
          border: '3px solid #93C5FD'
        }}>
          <div style={{ fontSize: '80px', marginBottom: '16px' }}>🏆</div>
          <h2 style={{ fontSize: '32px', color: '#1E40AF', marginBottom: '8px' }}>
            Chúc Mừng Bé Đã Hoàn Thành Quiz!
          </h2>
          <p style={{ fontSize: '18px', color: '#1D4ED8', fontWeight: 600, marginBottom: '24px' }}>
            Bé đạt được <strong>{score} Điểm</strong> và nhận ngay <strong>+3 Ngôi Sao ⭐</strong>!
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleRestart}
              className="btn-kid btn-outline"
              style={{ fontSize: '16px', padding: '14px 28px' }}
            >
              🔄 Làm Lại Quiz
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-kid btn-primary"
              style={{ fontSize: '16px', padding: '14px 32px' }}
            >
              🗺️ Về Lộ Trình Học
            </button>
          </div>
        </div>
      ) : (
        /* ================= U06 - NỘI DUNG CÂU HỎI & 4 LỰA CHỌN BẰNG HÌNH ẢNH ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Question Box */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '3px solid #E2E8F0',
            borderRadius: '24px',
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 6px 0 #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <h2 style={{ fontSize: '34px', color: '#1E293B', margin: 0, lineHeight: 1.25 }}>
              {currentQ.question_text}
            </h2>
            <button
              onClick={handlePronounceQuestion}
              className="btn-kid btn-warning"
              style={{ width: '56px', height: '56px', padding: 0, borderRadius: '50%', fontSize: '27px' }}
              title="Nghe câu hỏi"
            >
              🔊
            </button>
          </div>

          {/* 4 Image Choices Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '18px'
          }}>
            {(currentQ.answers || []).map((ans) => {
              const isSelected = selectedAnswer?.id === ans.id;
              let borderColor = '#E2E8F0';
              let shadowColor = '#CBD5E1';
              let bgColor = '#FFFFFF';

              if (isAnswered) {
                if (isCorrectAnswer(ans)) {
                  borderColor = '#22C55E';
                  shadowColor = '#16A34A';
                  bgColor = '#DCFCE7';
                } else if (isSelected) {
                  borderColor = '#EF4444';
                  shadowColor = '#DC2626';
                  bgColor = '#FEE2E2';
                }
              } else if (isSelected) {
                borderColor = '#3B82F6';
                shadowColor = '#2563EB';
                bgColor = '#EFF6FF';
              }

              return (
                <div
                  key={ans.id}
                  onClick={() => handleSelectAnswer(ans)}
                  style={{
                    backgroundColor: bgColor,
                    border: `3px solid ${borderColor}`,
                    boxShadow: `0 6px 0 ${shadowColor}`,
                    borderRadius: '24px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isAnswered ? 'default' : 'pointer',
                    transition: 'all 0.15s ease',
                    userSelect: 'none'
                  }}
                >
                  <div style={{
                    width: '100%',
                    height: '190px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    marginBottom: '12px'
                  }}>
                    <img
                      src={ans.media_url || getVocabularyFallbackImage(ans.answer_text)}
                      alt={ans.answer_text}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: '26px',
                    fontWeight: 700,
                    color: '#1E293B'
                  }}>
                    {ans.answer_text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Feedback Bottom Banner */}
          {isAnswered && (
            <div style={{
              backgroundColor: selectedAnswer && isCorrectAnswer(selectedAnswer) ? '#DCFCE7' : '#FEE2E2',
              border: `2.5px solid ${selectedAnswer && isCorrectAnswer(selectedAnswer) ? '#86EFAC' : '#FCA5A5'}`,
              borderRadius: '20px',
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '44px' }}>
                  {selectedAnswer && isCorrectAnswer(selectedAnswer) ? '🎉' : '💡'}
                </span>
                <div>
                  <div style={{
                    fontFamily: 'Fredoka, sans-serif',
                    fontWeight: 700,
                    fontSize: '22px',
                    color: selectedAnswer && isCorrectAnswer(selectedAnswer) ? '#166534' : '#991B1B'
                  }}>
                    {selectedAnswer && isCorrectAnswer(selectedAnswer)
                      ? 'Chính xác rồi! Bé giỏi quá!'
                      : wrongAnswerWasRetry
                      ? 'Bé đã ôn lại câu này rồi. Mình cùng cố gắng ở câu tiếp theo nhé!'
                      : 'Chưa đúng rồi! Câu này sẽ xuất hiện lại với vị trí đáp án mới để bé ghi nhớ nhé!'}
                  </div>
                  <div style={{ fontSize: '16px', color: selectedAnswer && isCorrectAnswer(selectedAnswer) ? '#15803D' : '#B91C1C', fontWeight: 600 }}>
                    {selectedAnswer && isCorrectAnswer(selectedAnswer)
                      ? '+10 Điểm thưởng ⭐'
                      : wrongAnswerWasRetry
                      ? 'Câu này đã được ôn lại rồi.'
                      : 'Bé hãy xem lại đáp án màu xanh lá cây; lần sau các đáp án sẽ đổi vị trí.'}
                  </div>
                </div>
              </div>

              <button
                onClick={handleNextQuestion}
                className={`btn-kid ${selectedAnswer && isCorrectAnswer(selectedAnswer) ? 'btn-primary' : 'btn-danger'}`}
                style={{ padding: '14px 30px', fontSize: '18px' }}
              >
                {currentIndex === questions.length - 1 ? 'Xem Kết Quả 🏆' : 'Câu Tiếp Theo →'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
