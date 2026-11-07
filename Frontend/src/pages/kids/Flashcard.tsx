import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { courseService } from '../../services/courseService';
import { progressService, type LessonRewardResult } from '../../services/progressService';
import { authService } from '../../services/authService';
import type { Vocabulary } from '../../types';
import { speakEnglish, sounds } from '../../utils/soundEffects';
import { getVocabularyFallbackImage } from '../../utils/vocabularyVisuals';
import RewardPopup from '../../components/RewardPopup';

export default function Flashcard() {
  const { topicId = '1' } = useParams<{ topicId: string }>();
  const [searchParams] = useSearchParams();
  const lessonId = Number(searchParams.get('lessonId')) || Number(topicId);
  const nextLessonId = Number(searchParams.get('nextLessonId')) || 0;
  const navigate = useNavigate();
  const [vocabList, setVocabList] = useState<Vocabulary[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [reward, setReward] = useState<LessonRewardResult | null>(null);

  useEffect(() => {
    courseService.getVocabulariesByTopic(Number(topicId)).then((data) => {
      if (data.length > 0) {
        setVocabList(data);
      }
    });
  }, [topicId]);

  const currentWord = vocabList[currentIndex] || {
    word: 'Apple',
    meaning_vi: 'Quả táo',
    phonetic: '/ˈæpəl/'
  };
  const fallbackImage = getVocabularyFallbackImage(currentWord.word);
  const [imageSrc, setImageSrc] = useState(currentWord.image_url || fallbackImage);

  useEffect(() => {
    setImageSrc(currentWord.image_url || getVocabularyFallbackImage(currentWord.word));
  }, [currentWord.word, currentWord.image_url]);

  const handlePronounce = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sounds.playClick();
    speakEnglish(currentWord.word);
  };

  const handleNext = () => {
    sounds.playClick();
    setIsFlipped(false);
    const viewedWord = vocabList[currentIndex];
    if (viewedWord?.id) {
      void progressService.markVocabularyLearned(viewedWord.id);
    }
    if (currentIndex < vocabList.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Completed flashcard set!
      setIsCompleted(true);
      const user = authService.getCurrentUser();
      progressService.completeLesson(user.id, lessonId, 100, 3).then((r) => {
        if (r) setReward(r);
      });
    }
  };

  const handlePrev = () => {
    sounds.playClick();
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleReset = () => {
    sounds.playClick();
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
  };

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {reward && (
        <RewardPopup
          reward={reward}
          lessonTitle="Học Từ Vựng Flashcard"
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
            🃏 Thẻ Từ Vựng Thông Minh
          </div>
          <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
            Từ số {currentIndex + 1} / {vocabList.length || 1}
          </div>
        </div>

        <button
          onClick={handlePronounce}
          className="btn-kid btn-warning"
          style={{ padding: '8px 16px', fontSize: '14px' }}
        >
          🔊 Nghe
        </button>
      </div>

      {/* Progress Bar */}
      <div style={{ height: '12px', backgroundColor: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{
          width: `${((currentIndex + 1) / (vocabList.length || 1)) * 100}%`,
          height: '100%',
          backgroundColor: '#58CC02',
          transition: 'width 0.3s ease'
        }}></div>
      </div>

      {/* Modal / Victory View when completed */}
      {isCompleted ? (
        <div className="card-kid animate-celebrate" style={{
          textAlign: 'center',
          padding: '48px 24px',
          backgroundColor: '#F0FDF4',
          border: '3px solid #86EFAC'
        }}>
          <div style={{ fontSize: '80px', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ fontSize: '32px', color: '#166534', marginBottom: '8px' }}>
            Xuất Sắc Quá Bé Ơi!
          </h2>
          <p style={{ fontSize: '16px', color: '#15803D', fontWeight: 600, marginBottom: '24px' }}>
            Bé đã hoàn thành bộ flashcard và nhận được <strong>+3 Ngôi Sao ⭐</strong> và <strong>+30 Xu 🪙</strong>!
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleReset}
              className="btn-kid btn-outline"
              style={{ fontSize: '16px', padding: '14px 28px' }}
            >
              🔄 Học Lại Bộ Này
            </button>
            <button
              onClick={() => nextLessonId
                ? navigate(`/lessons/${nextLessonId}/quiz`)
                : navigate('/dashboard')}
              className="btn-kid btn-primary"
              style={{ fontSize: '16px', padding: '14px 32px' }}
            >
              🎯 Thử Sức Làm Quiz Ngay
            </button>
          </div>
        </div>
      ) : (
        /* ================= U04 - 3D FLIP FLASHCARD ================= */
        <div
          onClick={() => { sounds.playClick(); setIsFlipped(!isFlipped); }}
          style={{
            cursor: 'pointer',
            minHeight: '520px',
            backgroundColor: '#FFFFFF',
            borderRadius: '28px',
            border: '3px solid #E2E8F0',
            boxShadow: '0 8px 0 #CBD5E1',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            userSelect: 'none',
            transition: 'transform 0.15s ease'
          }}
        >
          {/* Card Top hint */}
          <div style={{
            fontSize: '13px',
            color: '#94A3B8',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            {isFlipped ? '💡 Nghĩa Tiếng Việt' : '👆 Chạm vào thẻ để lật xem nghĩa'}
          </div>

          {/* Card Main Content */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', margin: 'auto' }}>
            {!isFlipped ? (
              <>
                {/* Large Image */}
                <div style={{
                  width: 'min(320px, 82vw)',
                  height: 'min(270px, 62vw)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  border: '3px solid #F1F5F9',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                }}>
                  <img
                    src={imageSrc}
                    alt={currentWord.word}
                    onError={() => setImageSrc(fallbackImage)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* English Word & Phonetic */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px'
                  }}>
                    <h2 style={{ fontSize: '52px', color: '#1E293B', margin: 0, lineHeight: 1.1 }}>
                      {currentWord.word}
                    </h2>
                    <button
                      onClick={handlePronounce}
                      className="btn-kid btn-primary"
                      style={{
                        width: '58px',
                        height: '58px',
                        padding: 0,
                        borderRadius: '50%',
                        fontSize: '27px'
                      }}
                      title="Phát âm từ này"
                    >
                      🔊
                    </button>
                  </div>
                  <div style={{ fontSize: '22px', color: '#64748B', fontFamily: 'monospace', marginTop: '8px' }}>
                    {currentWord.phonetic}
                  </div>
                </div>
              </>
            ) : (
              /* Back of card */
              <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                <div style={{ fontSize: '72px', marginBottom: '16px' }}>🌟</div>
                <h2 style={{ fontSize: '54px', color: '#2563EB', marginBottom: '10px', lineHeight: 1.15 }}>
                  {currentWord.meaning_vi}
                </h2>
                <div style={{ fontSize: '28px', color: '#64748B', fontWeight: 700, lineHeight: 1.35 }}>
                  "{currentWord.word}" có nghĩa là "{currentWord.meaning_vi}"
                </div>
              </div>
            )}
          </div>

          {/* Card Bottom helper */}
          <div style={{
            fontSize: '13px',
            color: '#64748B',
            fontWeight: 600,
            backgroundColor: '#F8FAFC',
            padding: '6px 16px',
            borderRadius: '999px',
            border: '1.5px solid #E2E8F0'
          }}>
            ⭐ Nhấn nút "Từ tiếp theo" khi bé đã nhớ nhé!
          </div>
        </div>
      )}

      {/* Control Buttons */}
      {!isCompleted && (
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'space-between' }}>
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="btn-kid btn-outline"
            style={{
              flex: 1,
              opacity: currentIndex === 0 ? 0.5 : 1,
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            ← Từ Trước
          </button>

          <button
            onClick={handleNext}
            className="btn-kid btn-primary"
            style={{ flex: 1.5, fontSize: '1.2rem', padding: '16px' }}
          >
            {currentIndex === vocabList.length - 1 ? '🎉 Hoàn Thành' : 'Từ Tiếp Theo →'}
          </button>
        </div>
      )}
    </div>
  );
}
