import React from 'react';
import { sounds } from '../../utils/soundEffects';

interface LessonCompleteModalProps {
  isOpen: boolean;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  starsEarned: number;
  onNextLesson: () => void;
  onReviewLesson: () => void;
}

export const LessonCompleteModal: React.FC<LessonCompleteModalProps> = ({
  isOpen,
  score,
  correctAnswers,
  totalQuestions,
  starsEarned = 3,
  onNextLesson,
  onReviewLesson
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      {/* ================= U12 - MODAL HOÀN THÀNH BÀI HỌC ================= */}
      <div className="animate-celebrate" style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '32px',
        border: '4px solid #86EFAC',
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.25)',
        maxWidth: '480px',
        width: '100%',
        padding: '36px 28px',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Mascot Celebrating */}
        <div className="animate-float" style={{ fontSize: '76px', marginBottom: '8px' }}>
          🦉🎉
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: '32px',
          color: '#166534',
          marginBottom: '8px',
          letterSpacing: '0.5px'
        }}>
          You Did It! 🌟
        </h2>
        <p style={{ fontSize: '15px', color: '#15803D', fontWeight: 600, marginBottom: '24px' }}>
          Bé đã xuất sắc hoàn thành chặng bài học hôm nay!
        </p>

        {/* 3 Stars Container */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '24px'
        }}>
          {[1, 2, 3].map((starIndex) => (
            <div
              key={starIndex}
              style={{
                fontSize: '44px',
                filter: starIndex <= starsEarned ? 'drop-shadow(0 4px 8px rgba(250, 204, 21, 0.5))' : 'grayscale(1)',
                transform: starIndex === 2 ? 'scale(1.2)' : 'scale(1)',
                transition: 'all 0.3s ease'
              }}
            >
              ⭐
            </div>
          ))}
        </div>

        {/* Score & Correct stats */}
        <div style={{
          backgroundColor: '#F8FAFC',
          border: '2px solid #E2E8F0',
          borderRadius: '20px',
          padding: '16px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '28px'
        }}>
          <div>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700 }}>TỔNG ĐIỂM</div>
            <div style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '26px', fontWeight: 800, color: '#2563EB' }}>
              +{score}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700 }}>CÂU TRẢ LỜI ĐÚNG</div>
            <div style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '26px', fontWeight: 800, color: '#16A34A' }}>
              {correctAnswers}/{totalQuestions}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => {
              sounds.playClick();
              onNextLesson();
            }}
            className="btn-kid btn-primary"
            style={{ width: '100%', padding: '16px', fontSize: '17px' }}
          >
            🚀 Học Tiếp Chặng Sau
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onReviewLesson();
            }}
            className="btn-kid btn-outline"
            style={{ width: '100%', padding: '14px', fontSize: '15px' }}
          >
            🔄 Ôn Tập Lại Bài Này
          </button>
        </div>
      </div>
    </div>
  );
};
