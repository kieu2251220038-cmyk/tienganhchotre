import { useEffect } from 'react';
import type { LessonRewardResult } from '../services/progressService';
import { sounds } from '../utils/soundEffects';

interface RewardPopupProps {
  reward: LessonRewardResult;
  lessonTitle?: string;
  onContinue: () => void;
  onClose: () => void;
}

export default function RewardPopup({ reward, lessonTitle, onContinue, onClose }: RewardPopupProps) {
  useEffect(() => {
    sounds.playVictory();
  }, []);

  const nextUnlock = getNextUnlock(reward.totalStars);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
      backdropFilter: 'blur(6px)'
    }}>
      {/* Popup card */}
      <div style={{
        background: 'linear-gradient(135deg, #FFFBEB 0%, #EFF6FF 50%, #F0FDF4 100%)',
        borderRadius: '32px',
        padding: '40px 36px',
        maxWidth: '520px',
        width: '100%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.3), 0 8px 0 #FDE68A',
        border: '3px solid #FDE68A',
        position: 'relative',
        textAlign: 'center',
        animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)'
      }}>
        <style>{`
          @keyframes popIn {
            from { transform: scale(0.6) translateY(40px); opacity: 0; }
            to   { transform: scale(1) translateY(0);    opacity: 1; }
          }
          @keyframes floatUp {
            0%   { transform: translateY(0);   opacity: 1; }
            100% { transform: translateY(-30px); opacity: 0; }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.08); }
          }
        `}</style>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '20px',
            background: 'none', border: 'none', fontSize: '22px',
            cursor: 'pointer', color: '#94A3B8', padding: '4px'
          }}
        >✕</button>

        {/* Trophy */}
        <div style={{ fontSize: '72px', marginBottom: '8px', animation: 'pulse 1.5s ease-in-out infinite' }}>
          🏆
        </div>

        <div style={{
          display: 'inline-block',
          backgroundColor: '#DCFCE7',
          color: '#166534',
          padding: '4px 16px',
          borderRadius: '999px',
          fontSize: '13px',
          fontWeight: 700,
          marginBottom: '12px'
        }}>
          {reward.isFirstTime ? '🎉 HOÀN THÀNH LẦN ĐẦU!' : '✅ Hoàn Thành Bài Học!'}
        </div>

        <h2 style={{
          fontFamily: 'Fredoka, sans-serif',
          fontSize: '26px',
          color: '#1E293B',
          margin: '0 0 6px'
        }}>
          {lessonTitle || 'Bé đã học xuất sắc!'}
        </h2>
        <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '28px' }}>
          Kho báu của bé vừa được cập nhật! 🌟
        </p>

        {/* Reward stats row */}
        <div style={{
          display: 'flex', gap: '12px', justifyContent: 'center',
          marginBottom: '28px', flexWrap: 'wrap'
        }}>
          {/* Stars */}
          <div style={{
            backgroundColor: '#FEF9C3',
            border: '2px solid #FDE047',
            borderRadius: '20px',
            padding: '16px 20px',
            minWidth: '100px'
          }}>
            <div style={{ fontSize: '32px' }}>⭐</div>
            <div style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '28px',
              fontWeight: 800,
              color: '#92400E'
            }}>+{reward.starsEarned}</div>
            <div style={{ fontSize: '12px', color: '#B45309', fontWeight: 700 }}>Ngôi Sao</div>
          </div>

          {/* Coins */}
          <div style={{
            backgroundColor: '#FFF7ED',
            border: '2px solid #FED7AA',
            borderRadius: '20px',
            padding: '16px 20px',
            minWidth: '100px'
          }}>
            <div style={{ fontSize: '32px' }}>🪙</div>
            <div style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '28px',
              fontWeight: 800,
              color: '#9A3412'
            }}>+{reward.coinsEarned}</div>
            <div style={{ fontSize: '12px', color: '#C2410C', fontWeight: 700 }}>Đồng Xu</div>
          </div>

          {/* Streak */}
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '2px solid #FECACA',
            borderRadius: '20px',
            padding: '16px 20px',
            minWidth: '100px'
          }}>
            <div style={{ fontSize: '32px' }}>🔥</div>
            <div style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '28px',
              fontWeight: 800,
              color: '#991B1B'
            }}>{reward.currentStreak}</div>
            <div style={{ fontSize: '12px', color: '#B91C1C', fontWeight: 700 }}>Ngày Liên Tiếp</div>
          </div>
        </div>

        {/* Total progress */}
        <div style={{
          backgroundColor: '#F8FAFC',
          border: '1.5px solid #E2E8F0',
          borderRadius: '16px',
          padding: '14px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', fontFamily: 'Fredoka, sans-serif' }}>
              {reward.totalStars} ⭐
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Tổng sao</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', fontFamily: 'Fredoka, sans-serif' }}>
              {reward.totalCoins} 🪙
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Tổng xu</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', fontFamily: 'Fredoka, sans-serif' }}>
              {reward.totalCompleted} 📖
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Bài đã học</div>
          </div>
        </div>

        {/* New Badges */}
        {reward.newBadges.length > 0 && (
          <div style={{
            backgroundColor: '#FFFBEB',
            border: '2px solid #FDE68A',
            borderRadius: '16px',
            padding: '14px 18px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#92400E', marginBottom: '8px' }}>
              🏅 Huy Hiệu Mới Nhận!
            </div>
            {reward.newBadges.map((badge, i) => (
              <div key={i} style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '15px',
                fontWeight: 700,
                color: '#B45309',
                padding: '4px 0'
              }}>
                {badge}
              </div>
            ))}
          </div>
        )}

        {/* Avatar Unlocks */}
        {reward.unlockedAvatars.length > 0 && (
          <div style={{
            backgroundColor: '#EFF6FF',
            border: '2px solid #BFDBFE',
            borderRadius: '16px',
            padding: '14px 18px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E40AF', marginBottom: '8px' }}>
              🎭 Trang Phục Mới Mở Khóa!
            </div>
            {reward.unlockedAvatars.map((avatar, i) => (
              <div key={i} style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '16px',
                fontWeight: 700,
                color: '#2563EB',
                padding: '4px 0'
              }}>
                {avatar.emoji} {avatar.name}
              </div>
            ))}
          </div>
        )}

        {/* Next unlock progress */}
        {nextUnlock && (
          <div style={{
            backgroundColor: '#F0FDF4',
            border: '1.5px dashed #86EFAC',
            borderRadius: '14px',
            padding: '12px 16px',
            marginBottom: '24px',
            fontSize: '13px',
            color: '#166534',
            fontWeight: 600
          }}>
            🎯 Cần thêm <strong>{nextUnlock.need} ⭐</strong> nữa để mở khóa <strong>{nextUnlock.emoji} {nextUnlock.name}</strong>!
            <div style={{
              marginTop: '8px',
              height: '8px',
              backgroundColor: '#DCFCE7',
              borderRadius: '999px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, (reward.totalStars / nextUnlock.target) * 100)}%`,
                backgroundColor: '#22C55E',
                borderRadius: '999px',
                transition: 'width 0.6s ease'
              }} />
            </div>
            <div style={{ fontSize: '11px', color: '#4ADE80', marginTop: '4px' }}>
              {reward.totalStars} / {nextUnlock.target} ⭐
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={onContinue}
            style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '17px',
              fontWeight: 800,
              padding: '14px 36px',
              borderRadius: '20px',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 5px 0 #059669',
              transition: 'all 0.15s ease'
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'translateY(3px)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            ▶ Tiếp Tục Học
          </button>
          <button
            onClick={onClose}
            style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '17px',
              fontWeight: 700,
              padding: '14px 24px',
              borderRadius: '20px',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              border: '2px solid #E2E8F0',
              cursor: 'pointer',
              boxShadow: '0 4px 0 #E2E8F0',
              transition: 'all 0.15s ease'
            }}
          >
            🏠 Về Trang Chủ
          </button>
        </div>
      </div>
    </div>
  );
}

// Tính avatar tiếp theo cần mở khóa
const AVATAR_MILESTONES = [
  { name: 'Cánh Cụt Vui',     emoji: '🐧', cost: 30  },
  { name: 'Siêu Nhân Nhỏ',    emoji: '🦸', cost: 50  },
  { name: 'Sư Tử Dũng Cảm',   emoji: '🦁', cost: 60  },
  { name: 'Nhà Vô Địch',      emoji: '🏆', cost: 100 },
  { name: 'Phù Thủy Thông Minh', emoji: '🧙', cost: 150 },
  { name: 'Rồng Huyền Thoại', emoji: '🐲', cost: 200 },
];

function getNextUnlock(totalStars: number) {
  const next = AVATAR_MILESTONES.find(m => m.cost > totalStars);
  if (!next) return null;
  return { ...next, target: next.cost, need: next.cost - totalStars };
}
