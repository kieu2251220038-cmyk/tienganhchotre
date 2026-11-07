import { useEffect } from 'react';
import type { ChestRewardResult } from '../../services/progressService';
import { sounds } from '../../utils/soundEffects';

interface ChestRewardModalProps {
  reward: ChestRewardResult;
  onNextLevel: () => void;
  onClose: () => void;
}

export default function ChestRewardModal({ reward, onNextLevel, onClose }: ChestRewardModalProps) {
  useEffect(() => {
    sounds.playVictory();
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      backgroundColor: 'rgba(15, 23, 42, 0.72)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      backdropFilter: 'blur(6px)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        padding: '34px 28px 28px',
        borderRadius: '30px',
        border: '3px solid #FBBF24',
        background: 'linear-gradient(135deg, #FFFBEB 0%, #FFF7ED 55%, #F0FDF4 100%)',
        boxShadow: '0 20px 0 #D97706, 0 28px 64px rgba(0,0,0,0.28)',
        textAlign: 'center',
        position: 'relative'
      }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng phần thưởng rương"
          style={{
            position: 'absolute',
            top: '12px',
            right: '16px',
            border: 'none',
            background: 'transparent',
            color: '#92400E',
            fontSize: '22px',
            cursor: 'pointer'
          }}
        >✕</button>

        <div style={{ fontSize: '74px', lineHeight: 1, marginBottom: '12px' }}>🎁✨</div>
        <div style={{ color: '#B45309', fontWeight: 900, fontSize: '13px', letterSpacing: '.4px' }}>
          RƯƠNG QUÀ BẬC {reward.ageGroup} TUỔI ĐÃ MỞ
        </div>
        <h2 style={{ fontFamily: 'Fredoka, sans-serif', color: '#78350F', fontSize: '28px', margin: '8px 0' }}>
          Bé nhận được phần thưởng!
        </h2>
        <p style={{ color: '#92400E', fontWeight: 700, margin: '0 0 22px' }}>
          {reward.levelUpMessage}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '22px' }}>
          <div style={{ minWidth: '130px', padding: '14px 18px', borderRadius: '18px', border: '2px solid #FDE047', backgroundColor: '#FEF9C3' }}>
            <div style={{ fontSize: '30px' }}>⭐</div>
            <strong style={{ display: 'block', color: '#92400E', fontSize: '26px' }}>+{reward.rewardStars}</strong>
            <span style={{ color: '#B45309', fontSize: '12px', fontWeight: 800 }}>Ngôi sao</span>
          </div>
          <div style={{ minWidth: '130px', padding: '14px 18px', borderRadius: '18px', border: '2px solid #FDBA74', backgroundColor: '#FFF7ED' }}>
            <div style={{ fontSize: '30px' }}>🪙</div>
            <strong style={{ display: 'block', color: '#9A3412', fontSize: '26px' }}>+{reward.rewardCoins}</strong>
            <span style={{ color: '#C2410C', fontSize: '12px', fontWeight: 800 }}>Đồng xu</span>
          </div>
        </div>

        <p style={{ color: '#475569', fontSize: '13px', fontWeight: 700, marginBottom: '22px' }}>
          Tổng số dư mới: <strong>{reward.totalStars} ⭐</strong> và <strong>{reward.totalCoins} 🪙</strong>
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {reward.nextAge && (
            <button type="button" onClick={onNextLevel} className="btn-kid btn-primary" style={{ padding: '12px 22px' }}>
              📚 HỌC BẬC {reward.nextAge}
            </button>
          )}
          <button type="button" onClick={onClose} className="btn-kid btn-outline" style={{ padding: '12px 22px' }}>
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}
